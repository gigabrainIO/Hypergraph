import { SpatialGraph } from "./SpatialGraph.mjs";
import { CausalGraph } from "./CausalGraph.mjs";

/**
* @class Graph representing a regular graph with adjacency lists and methods.
* @author Mika Suominen
*/
class HypergraphRewritingSystem {

	/**
	* Rewriting rule.
	* @typedef {Hyperedge[]} RulePattern
	*/

	/**
	* Creates an instance of SpatialGraph.
	* @constructor
	*/
	constructor() {
		this.spatial = new SpatialGraph(); // Spatial hypergraph
		this.causal = new CausalGraph(); // Causal graph

		this.rules = []; // Rewriting rules
		this.initial = []; // Initial graph

		this.step = 0;
		this.eventcnt = 0;
		this.maxevents = 0; // Maximum limit set for events length
		this.matches = []; // LHS hits as maps
		this.eventordering = ""; // Event ordering
		this.ruleordering = ""; // Rule ordering
		this.progressfn = null; // Callback for rewrite progress
		this.finishedfn = null; // Callback for rewrite finished
		this.duration = 0; // Elapsed time processing the rules

		this.rewritedelay = 100; // Delay between rewrites in msec
	}

	/**
	* Map subgraph pattern to real subgraph using 'map'.
	* @param {Hypergraph} graph Hypergraph
	* @param {RulePattern} rulepatterns Patterns to map
	* @param {number[]} map Map from pattern to real vertices
	* @return {RulePattern} Real subgraph.
	*/
	mapper( graph, patterns, map ) {
		return patterns.map( p => p.map( v => ( v < map.length ? map[v] : graph.maxv + ( v - map.length ) + 1 ) ) );
	}

	/**
	* Find possible mappings between rule pattern 'lhs' and the hypergraph.
	* @param {Hypergraph} graph Hypergraph
	*/
	findMatches( graph ) {
		this.matches.length = 0;

		// No rules, no matches
		if ( this.rules.length == 0 ) return;

		// Check each edge for hit
		for( let e of graph.E.values() ) {
			let edge = e.edge;

			// Go through all the rules
			for( let i=0; i < this.rules.length; i++ ) {
				let rule = this.rules[i];

				// Next rule if the lengths don't match
				if ( edge.length !== rule.lhs[0].length ) continue;

				// Map based on this edge
				let maxnum = Math.max( ...rule.lhs.flat() );
				let map0 = new Array( maxnum + 1 ).fill( -1 );
				for( let n = edge.length - 1; n >=0; n-- ) map0[ rule.lhs[0][n] ] = edge[n];

				// Go through all the other parts of the lhs rule
				let mapsNext = [ map0 ];
				let len = rule.lhs.length;
				for( let j = 1; j < len; j++ ) {
					let pattern = rule.lhs[j];
					let maps = mapsNext;
					mapsNext = [];

					// Iterate all mapping hypotheses
					for( let k = maps.length - 1; k >= 0; k-- ) {
						let edges = graph.find( this.mapper( graph, [ pattern ], maps[k] )[0] );
						for (let l = edges.length - 1; l >= 0; l-- ) {
							let map = [ ...maps[k] ];
							for(let n = pattern.length - 1; n >= 0; n-- ) map[ pattern[n] ] = edges[l][n];
							mapsNext.push( map );
						}
					}
				}
				// Replicate according to the final results
				for( let k = mapsNext.length - 1; k >= 0; k-- ) {
					this.matches.push( ...new Array( graph.count( this.mapper( graph, rule.lhs, mapsNext[k] ) ) ).fill().map( () => { return { r: i, m: mapsNext[k] }; } ) );
				}
			}
		}
	}

	/**
	* Process the given rewriting rule 'lhs' 'rhs' using the given
	* array of mappings 'maps'.
	* @param {Hypergraph} spatial Spatial hypergraph
	* @param {Hypergraph} causal Causal hypergraph
	*/
	processMatches( spatial, causal ) {
		// Remove overlapping parts from the rules
		let rulesNol = [];
		for( let i=0; i < this.rules.length; i++ ) {
			const lhs = this.rules[i].lhs.filter( p => !this.rules[i].rhs.map(x => x.join(",") ).includes( p.join(",") ) );
			const rhs = this.rules[i].rhs.filter( p => !this.rules[i].lhs.map(x => x.join(",") ).includes( p.join(",") ) );
			rulesNol.push( { lhs: lhs, rhs: rhs } );
		}

		// Process all maps in sequence
		for( let i=0; i < this.matches.length; i++ ) {

			const hit = this.mapper( spatial, this.rules[ this.matches[i].r ].lhs , this.matches[i].m );
			if ( spatial.count( hit ) ) {

				// Rewrite spatial graph
				const del = this.mapper( spatial, rulesNol[ this.matches[i].r ].lhs , this.matches[i].m );
				const add = this.mapper( spatial, rulesNol[ this.matches[i].r ].rhs, this.matches[i].m );
				spatial.rewrite( del, add );

				// Add event to causal graph
				const match = this.matches[i].m;
				const modified = [ ...new Set( add.flat() ) ].sort();
				causal.rewrite( match, modified, { step: this.step } );

				// Break when limit reached
				if ( ++this.eventcnt >= this.maxevents ) break;
			}

		}

	}

	/**
	* Timed rewriting process.
	*/
	rewrite = () => {
		let start = performance.now();

		do {
			// New step
			this.step++;

			// Find all hits, break if no hits
			this.findMatches( this.spatial );
			if ( this.matches.length === 0 ) break;

			// Shuffle matches
			for (let i = this.matches.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.matches[i], this.matches[j]] = [this.matches[j], this.matches[i]];
			}
			if ( this.eventordering !== 'random' ) {
				this.matches.forEach( match => {
					match.order = match.m.map( v => this.causal.L.get( v )[0] ).sort( (a,b) => b - a);
				});
				if ( this.eventordering === 'ascending' ) {
					this.matches.sort( (a,b) => {
						const minlen = a.order.length < b.order.length ? a.order.length : b.order.length;
						for(let i = 0; i < minlen; i++ ) {
							if ( a.order[i] !== b.order[i] ) return b.order[i] - a.order[i];
						}
						return b.order.length - a.order.length;
					});
				} else if ( this.eventordering === 'descending' ) {
					this.matches.sort( (a,b) => {
						const minlen = a.order.length < b.order.length ? a.order.length : b.order.length;
						for(let i = 0; i < minlen; i++ ) {
							if ( a.order[i] !== b.order[i] ) return a.order[i] - b.order[i];
						}
						return a.order.length - b.order.length;
					});
				}
			}
			// Rule ordering
			if ( this.rules.length > 1 ) {
				if ( this.ruleordering === 'index' ) {
					this.matches.sort( (a,b) => a.r - b.r );
				} else if ( this.ruleordering === 'indexrev' ) {
					this.matches.sort( (a,b) => b.r - a.r );
				}
			}

			// Process matches by running events, break if 'maxevents' is reached
			this.processMatches( this.spatial, this.causal );
			if ( this.eventcnt >= this.maxevents ) break;
		}
		while( (performance.now() - start) < 500 );

		let end = performance.now();
		this.duration += end - start; // msec

		// Notify progress to parent
		if ( this.progressfn ) this.progressfn( this.eventcnt );

		// Break when there were no more matches or the limit was reached
		if ( this.matches.length === 0 || this.eventcnt >= this.maxevents ) {
			this.matches.length = 0;
			if ( this.finishedfn ) this.finishedfn();
			return;
		}

		// Empty matches
		this.matches.length = 0;

		// Continue to run after a short delay
		setTimeout( this.rewrite, this.rewritedelay );

	}

	/**
	* Callback for rewriting progress update.
	* @callback progressfn
	* @param {numeric} eventcnt Number of events processed.
	*/

	/**
	* Callback for rewriting process finished.
	* @callback finishedfn
	*/

	/**
	* Run abstract rewriting rules.
	* @param {Rules} rules Rewriting rules
	* @param {Rules} initial Rewriting rules
	* @param {string} [ruleOrdering="mixed"] Rewriting rules
	* @param {string} [eventOrdering="random"] Rewriting rules
	* @param {number} [maxevents=500] Rewriting rules
	* @param {progressfn} progressfn Progress update callback function
	* @param {finishedfn} finishedfn Rewriting finished callback function
	*/
	run( rules, initial, ruleOrdering = "mixed", eventOrdering = "random", maxevents = 500, progressfn = null, finishedfn = null ) {

		// Initialize system
		this.spatial.clear();
		this.causal.clear();
		this.matches.length = 0;
		this.duration = 0;
		this.eventcnt = 0;
		this.step = 0;

		// Set parameters
		this.rules = rules;
		this.initial = initial;
		this.ruleordering = ruleOrdering;
		this.eventordering = eventOrdering;
		this.maxevents = maxevents;
		this.progressfn = progressfn;
		this.finishedfn = finishedfn;

		// Add initial edges
		this.spatial.rewrite( [], this.initial );
		this.causal.rewrite( [], [ ...new Set( this.initial.flat() ) ].sort(), { step: this.step } );

		// Start rewriting process
		setTimeout( this.rewrite, this.rewritedelay );

	}

	/**
	* Cancel rewriting process.
	*/
	cancel() {
		this.maxevents = 0;
	}

	/**
	* Report status.
	* @return {Object} Status of the spatial graph.
	*/
	status() {
		return {};
		// return { secs: (this.duration / 1000).toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 }) };
	}

}


export { HypergraphRewritingSystem };
