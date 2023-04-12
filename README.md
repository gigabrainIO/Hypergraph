# Hypergraph Rewriting System

<img src="screenshot.jpg" width="512">

**Run it: https://met4citizen.github.io/Hypergraph/**

Hypergraph Rewriting System able to visualize both
single-way and multiway evolutions in 3D.

The app uses
[3d Force-Directed Graph](https://github.com/vasturiano/3d-force-graph)
for representing graph structures,
[ThreeJS](https://github.com/mrdoob/three.js/)/WebGL for 3D rendering and
[d3-force-3d](https://github.com/vasturiano/d3-force-3d) for the force engine.

## Introduction

A hypergraph is a generalization of a regular graph. Whereas an edge
typically connects only two nodes, a hyperedge can join any number of nodes.
In a Hypergraph Rewriting System some initial hypergraph is transformed
incrementally by making a series of updates that follow some abstract
rewriting rule.

As an example, consider an abstract rewriting rule
`(x,x,y)(y,z,u)->(x,v,u)(y,v,z)(v,v,u)`. Wherever and whenever a subhypergraph
having the form of the left-hand side pattern `(x,x,y)(y,z,u)` is found in the
hypergraph, it is replaced with a new subhypergraph having the form of the
right-hand side pattern `(x,v,u)(y,v,z)(v,v,u)` introducing a new node `v`.

Sometimes matches overlap. For example, when using the previous rule
with the initial state `(1,1,2)(2,2,3)(3,3,4)` there are two overlapping
matches `(x=1,y=2,z=2,u=3)` and `(x=2,y=3,z=3,u=4)` (critical pair). One way
to resolve the conflict is to pick one of the two according to some
ordering scheme and ignore the other (single-way evolution). Another approach
is to rewrite both by allowing the system to branch (multiway evolution).

As the multiway system branches and diverges (quantum mechanics), the
probability of ending up in some particular end state is related to the number
of different evolutionary paths to that state (path counting). However, there
can also be rules that make branches merge (critical pair completion).
This branching and merging makes certain end states more/less likely
(constructive/destructive interference). In the end we (observers) are likely
to find ourselves in the part of the system in which the branches always merge
(confluence) and the system converges (classical mechanics).

For more information about hypergraph rewriting systems and their potential to
represent fundamental physics visit
[The Wolfram Physics Project](https://www.wolframphysics.org) website.
According to their
[technical documents](https://www.wolframphysics.org/technical-documents/)
certain models reproduce key features of both relativity and quantum
mechanics.

If you are interested in quantum mechanics and graph theory, you might also
want to take a look at my spin-off projects
[BigraphQM](https://github.com/met4citizen/BigraphQM) and
[CliqueVM](https://github.com/met4citizen/CliqueVM).
For a philosophical take on these ideas see my blog post
[The Game of Algorithms](https://metacity.blogspot.com/).

## Rules

Click `RULE` to modify the rewriting rule, change its settings, and run
the rewriting process.

The system supports several rules separated with a semicolon `;` or written
on separate lines. The two sides of any one-way rule must be separated
with an arrow `->`. The separator `==` can be used as a shortcut for a two-way
setup in which both directions (the rule and its inverse) are possible.

Hyperedge patterns can be described by using numbers, characters or words.
Several types of parentheses are also supported. For example, a rule
`[{x,y}{x,z}]->[{x,y}{x,w}{y,w}{z,w}]` is considered valid and can be
validated and converted to the default number format by clicking `Scan`.

The system also supports a filter/negation `\`. As an example, the rule
`(1)(1,2)\(2)->(1)(1,2)(2)` is applied only if there is no unary edge `(2)`.
If the branchlike interactions are allowed, the check is made relative to all
possible branches of history.

A rule without any right-hand side, such as `(1,1,1)(1,1,1)`, is used as the
initial graph. An alternative way to define an initial state is to use
some predefined function:

Initial graph | Description
--- | ---
`complete(n)` | Complete graph with `n` vertices so that each vertex is connected to every other vertex.
`grid(d1,d2,...)` | Grid with sides of length `d1`, `d2`, and so on. The number of parameters defines the dimension of the grid. For example, `grid(2,4,5)` creates a 3-dimensional 2x4x5 grid.
`line(n)` | Line with `n` vertices.
`points(n)` | `n` unconnected unary edges.
`prerun(n)` | Pre-run the current rule for `n` events in one branch (singleway). The leaves of the result are used as an initial state.
`random(n,d,nedges)` | Random graph with `n` vertices so that each vertex is sprinkled randomly in `d` dimensional space and has at least `nedges` connections.
`rule('rule',n)` | Run rewriting rule `rule` for maximum `n` events in one branch (singleway).  The leaves of the result are used as an initial state.
`sphere(n)` | Fibonacci sphere with `n` vertices.

By using options `twoway`, `oneway` and/or `inverse`, each edge produced can
be made a two-way edge, sorted or reversed. It is also possible to define some
specific branch, or a combination of branches, for the initial state. As an
example, `(1,1)(1,1)/7`, would specify branches 1-3 (the sum of the first
three bits 1+2+4). By default, the initial state is set for all the tracked
branches.

If the initial state is not specified, the left-hand side pattern of the first
rule is used, but with only a single node. For example, a rule
`(1,2)(1,3)->(1,2)(1,4)(2,4)(3,4)` gives an initial state `(1,1)(1,1)`.

The `Evolution` option defines which kind of evolution is to be simulated:

Evolution | Description
--- | ---
`1`,`2`,`4` | Single-way system with 1/2/4 branches. By default, random event order is used to resolve overlaps for each branch. If the `WM` option is set, Wolfram model's standard event order is used for branch 1 and its reverse for branch 2.
`FULL` | Full multiway system. All the matches are instantiated and four branches tracked.

The `Interactions` option defines the possible interactions between hyperedges.
Any combination of the three possible interactions can be selected.

Interactions | Description
--- | ---
`SPACE` | Allow interactions between spacelike separated hyperedges. Two edges are spacelike separated if their lowest common ancestors are all updating events. In practice this should always be selected, because the nodes in a typical initial state are spacelike separated.
`TIME` | Allow interaction between timelike separated hyperedges. Two edges are timelike separated if either one of them is an ancestors of the other one, that is, inside the other's past causal cone.
`BRANCH` | Allow interaction between branchlike separated hyperedges. Two edges are branchlike separated if any of their lowest common ancestors is a hyperedge.

Other options:

Option | Description
--- | ---
`WM` | Wolfram Model. If set, the first branch uses Wolfram Model's standard event order (LeastRecentEdge + RuleOrdering + RuleIndex) and the second branch its reverse. By default the setting is off and all tracked branches use random event ordering.
`RO` | Rule order (index). Regardless of other settings, always try to apply the events in the order in which the rules have been specified. By default the setting is off and the individual rules are allowed to mix.
`DD` | De-duplicate. The overlapping new hyperedges on different branches are de-duplicated at the end of each step. This allows branches to merge. EXPERIMENTAL, FUNCTIONALITY LIKELY TO CHANGE.


## Simulation/Observer

Simulation can be run in three different modes: `Space`, `Time` or `Phase`.

- In `Space` mode the system shows the evolution of the spatial hypergraph.
According to the Wolfram Model, the spatial hypergraph represents
a spacelike state of the universe with nodes as "atoms of space".
- In `Time` mode the system builds up the transitive reduction of the causal
graph. In this view nodes represent updating events and directed
edges their causal relations. According to the Wolfram Model, the flux of
causal edges through spacelike and timelike hypersurfaces is related to
energy and momentum respectively.
- In `Phase` mode the hyper-dimensional multiway space is projected in 3D by
using Hamming distances and k-NN algorithm (see [Appendix A](#appendix-a):
Coordinatization of Local Multiway System by using Hyper-dimensional Vectors).
According to Wolfram Model, positions in so-called "branchial" space are
related to quantum phase.

Media buttons let you reset the mode, start/pause the simulation and
skip to the end. Whenever the system has branches, the first four
branches can be shown separately or in any combination. If `Past` is selected,
the full history of the local multiway system is shown in space mode.
By default only the leaf edges of the system are visible.

The two sliders change the visual appearance of the graph by tuning the
parameters of the underlying force engine. Note: Changing the viewpoint
or the forces do not in any way change the multiway system itself only
how it is visualized on the screen.


## Highlighting

Subhypergraphs can be highlighted by clicking `RED`/`BLUE` and using one or
more of the following commands:

Command | Highlighted | Status Bar
--- | --- | ---
`curv(x,y)` | Two n-dimensional balls of radius one and the shortest path between their centers. | Curvature based on Ollivier-Ricci (1-Wasserstein) distance.
`dim([x],[radius])` | N-dimensional ball with an origin `x` (random, if not specified) and radius `r` (automatically scaled if not specified). | The effective dimension `d` based on nearby n-ball volumes fitted to `r^d`.
`geodesic(x,y,[dir],[rev],[all])`<br/><br/>`dir` = directed edges<br/>`rev` = reverse direction<br/>`all` = all shortest paths | Shortest path(s) between two nodes.<br/><br/> | Path distance as the number of edges.
`lightcone(x,length)` | Lightcone centered at node `x` with size `length`. `TIME` mode only. | Size of the cones as the number of edges.
`phase(x,y)` | Multiway distance between two nodes. | Multiway distance 0-10,240. Mid-point 5,120 corresponds to orthogonal vectors (phase difference PI).
`nball(x,radius,[dir],[rev])`<br/><br/>`dir` = directed edges<br/>`rev` = reverse direction | N-dimensional ball is a set of nodes and edges within a distance `radius` from a given node `x`. | Volume as the number of edges.
`nsphere(x,radius,[dir],[rev])`<br/><br/>`dir` = directed edges<br/>`rev` = reverse direction | N-dimensional sphere/hypersurface within a distance `radius` from a given node `x`. | Area as the number of nodes.
`random(x,distance,[dir],[rev])`<br/><br/>`dir` = directed edges<br/>`rev` = reverse direction | Random walk starting from a specific node `x` with maximum `distance`. | Path distance as the number of edges.
`surface(x,y)` | Space-like hypersurface based on a range of nodes. | Volume as the number of nodes.
`worldline(x,...)` | Time-like curve of space-like node/nodes. `TIME` mode only. | Distance as the number of edges.
`(x,y)(y,z)`<br>`(x,y)(y,z)\(z)->(x,y)` | Subhypergraphs matching the given rule-based pattern. The right hand side pattern can be used to specify which part of the match is highlighted. `SPACE` mode only. | The number of rule-based matches.

The node parameters can be specified with identifiers you can find by
hovering the mouse pointer over nodes. It is also possible to use
variables `x` and `y`. To set variable `x` click on any node and to set `y`
use right click.


## Scalar Fields

Click `GRAD` to visualize predefined scalar fields. Relative intensity of
the field is represented by different hues of colour from light blue (lowest)
to green to yellow (mid) to orange to red (highest). Field values are
calculated for each edge and the colours of the vertices represent
the mean of their edges.

Scalar Field | Description
--- | ---
`branch` | Branch id. With two branches the main colours are blue and red. With four branches blue, green, orange and red. For shared edges the colour is in the middle of the spectrum.
`created` | Creation time from oldest to newest.
`curvature` | Ollivier-Ricci curvature. NOTE: Calculating curvature is a CPU intensive task. When used in real-time it will slow down the animation.
`degree` | The mean of incoming and outgoing edges.
`energy` | The mean of updated edges.
`mass` | The part of `energy` in which the right hand side edges connect pre-existing vertices.
`momentum` | The part of `energy` in which the right hand side edges have new vertices.
`pathcnt` | The number of paths leading to specific edge.
`phase(x)` | Multiway distance to a given token `x`. Multiway coordinates are calculated using 10,240-dimensional dense bipolar hypervectors. Distances close to 5,120, that is, 1/2 of the dimension, can be considered orthogonal. NOTE: Hyperdimensional computing is CPU intensive, so when used in real-time it will slow down the animation.
`probability` | Normalized path count for each edge in each step.
`step` | Rewriting step.

The value range can be limited by giving lower and higher limits as
parameters. For example, `branch(2,4)` shows branches 2-4. A limit can also
be given as a percentage. For example, `energy(50%,100%)` highlights
only upper half of the full range.

## Notes

The aim of this project has been to learn some basic concepts and
ideas related to hypergraphs and hypergraph rewriting. Whereas the Wolfram
physics project has been a great inspiration, this project is not directly
associated with it, doesn't use any code from it, and doesn't claim to be
compatible with the Wolfram Model.

As a historical note, the idea of "atoms of space" is not a new one. It already
appears in the old Greek tradition of atomism (*atomos*, "uncuttable") started
by Democritus (ca. 460–370 BCE). In the Hellenistic period the idea was revived
by Epicurus (341–270 BCE) and put in a poetic form by Lucretius (ca. 99–55 BCE).
Unfortunately, starting from the Early Middle Ages, atomism was mostly
forgotten in the Western world until Lucretius' *De Rerum Natura* and other
atomist teachings were rediscovered in the 14th century.

> “The atoms come together in different order and position, like letters,
> which, though they are few, yet, by being placed together in different ways,
> produce innumerable words.”
> -- Epicurus (according to Lactantius)

## Appendix A

### Coordinatization of Local Multiway System using Hyperdimensional Vectors

The following procedure utilizes Pentti Kanerva's work on Hyperdimensional
computing [1]. HDC is based on the fact that in hyperdimensional space
(>10,000-D) a randomly chosen vector (hypervector) is quasi-orthogonal to
all previously generated hypervectors.

- For each rewriting rule, generate a random 10,240-dimensional dense bipolar
{-1,1} seed vector.

- Let the coordinate of the initial event in a local multiway system be a
randomly generated 10,240-dimensional dense bipolar {-1,1} vector.

- Let the coordinate of each new token/event be the sum of its parents'
coordinates so that the 'sum' is the element-wise majority with random bipolar
values for ties.

- Whenever the parents are timelike/branchlike separated, instead of summing up
their own coordinates, use the coordinates of their lowest common ancestors.

- Whenever there is a new branch so that two or more events use an overlapping
set of tokens, separate the events in orthogonal branches by adding random
hypervectors to their previously calculated coordinates.

- The distance between the coordinates of any two tokens/events is the
Hamming distance between their hypervectors. If the distance is close to
1/2 of the used dimension, the two hypervectors are quasi-orthogonal.

The local multiway coordinates can be projected into some lower dimension by
first calculating the distance matrix and then doing multidimensional scaling.
Al alternative way to do the projection is to build a graph in which
each node represents a group of close-by tokens/events. These groups can then
be connected to their 1-3 nearest neighbours by using a k-NN algorithm.

*[1] Kanerva, P. (2019). Computing with High-Dimensional Vectors. IEEE Design & Test, 36(3):7–14.*
