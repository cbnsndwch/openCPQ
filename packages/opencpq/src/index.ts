// Core
export { Node, Type } from './core/base';
export type { MakeNode } from './core/base';
export {
    linearAggregation,
    multiplying,
    NamedAdder,
    SimpleAdder
} from './core/linear-aggregation';
export type { Aggregator } from './core/linear-aggregation';
export { named, namespace } from './core/names';
export type { NamedOptions } from './core/names';
export { op } from './core/op';
export type { OpFn } from './core/op';
export { Path, rootPath } from './core/path';
export { Problems } from './core/problems';
export type { ProblemLevel, ProblemMessage } from './core/problems';
export { deserialize, serialize } from './core/serialize';
export type { Ctx, CtxBase, INode, Visitor } from './core/types';
export { sideEffect } from './core/util';
export { makeDataNode, registerView } from './core/node-view';
export type { DataNode, DataNodeKind } from './core/node-view';

// Components
export { accordion } from './components/accordion';
export type { AccordionNode } from './components/accordion';
export { ConfirmOrRetractButton } from './components/confirm-retract';
export type { ConfirmRetractSize } from './components/confirm-retract';
export { fixedTable, row } from './components/fixed-table';
export type { FixedTableNode, RawColumnsSpec } from './components/fixed-table';
export { HBox } from './components/display';
export {
    group,
    member,
    unlabelledMember,
    preprocessMembers,
    findMember
} from './components/group';
export type {
    GroupNode,
    Member,
    MemberDecl,
    RawMemberDecls
} from './components/group';
export { html } from './components/html';
export type { HtmlNode } from './components/html';
export { labeled } from './components/label';
export type { LabeledNode } from './components/label';
export { panel } from './components/panel';
export type { PanelOptions, PanelNode } from './components/panel';
export {
    boolean,
    date,
    integer,
    number,
    string,
    textarea,
    time,
    unit
} from './components/primitives';
export type {
    BooleanNode,
    DateNode,
    IntegerNode,
    NumberNode,
    StringNode,
    TextareaNode,
    TimeNode,
    UnitNode
} from './components/primitives';
export { renderProblems, VProblems } from './components/problems-view';
export {
    option,
    defaultOption,
    either,
    selected,
    select,
    unansweredOption
} from './components/select';
export type {
    EitherNode,
    EitherOptions,
    Option,
    OptionMode,
    RawOptions,
    SelectedValue,
    SelectNode
} from './components/select';
export { tabs } from './components/tabbed-area';
export type { TabbedAreaNode } from './components/tabbed-area';
export { column, table } from './components/table';
export type { Column, TableNode, TableOptions } from './components/table';
export {
    validate,
    validationMessages,
    renderValidation,
    renderWithValidation
} from './components/validation';
export type {
    ValidationCallbacks,
    ValidationTestFn,
    ValidationNode,
    ValidationMessagesNode
} from './components/validation';

// Domain
export { BOMView, bomEntry, csvLine, VBOM } from './domain/bom';
export type { BOMItemEntry } from './domain/bom';
export { quantified, quantifiedList } from './domain/quantification';
export { tocEntry, TOC, VTOC } from './domain/toc';
export type { HeadingFn, TOCNode } from './domain/toc';
export {
    image,
    svgRoot,
    transform,
    wrapVisualization,
    SVGImage,
    Visualization,
    VisualizationContainer,
    VVisualization
} from './domain/visualization';
export type {
    ImageSpec,
    RawImageSpec,
    Renderable
} from './domain/visualization';
export { workbench, View } from './domain/workbench';
export type {
    ViewsFn,
    WorkbenchNode,
    WorkbenchRender
} from './domain/workbench';

// App shells
export { downloadBlob } from './app/download';
export { EmbeddedRoot } from './app/EmbeddedRoot';
export type { EmbeddedRootProps } from './app/EmbeddedRoot';
export { Root } from './app/Root';
export type { RootApi, RootProps } from './app/Root';

// --- Namespace -------------------------------------------------------------
//
// The `t` namespace bundles every type factory and value helper under a
// single object. It's the recommended way to consume openCPQ:
//
//     import { t } from '@cbnsndwch/opencpq';
//     t.group([
//         t.member('color', 'Color', t.select([
//             t.option('red', 'Red'),
//             t.defaultOption(t.option('blue', 'Blue'))
//         ]))
//     ])
//
// Individual named exports above are kept for tree-shaking and advanced use.

import { accordion } from './components/accordion';
import { fixedTable, row } from './components/fixed-table';
import { group, member, unlabelledMember } from './components/group';
import { html } from './components/html';
import { labeled } from './components/label';
import { panel } from './components/panel';
import {
    boolean,
    date,
    integer,
    number,
    string,
    textarea,
    time,
    unit
} from './components/primitives';
import {
    option,
    defaultOption,
    either,
    selected,
    select,
    unansweredOption
} from './components/select';
import { tabs } from './components/tabbed-area';
import { column, table } from './components/table';
import { validate, validationMessages } from './components/validation';
import { linearAggregation, multiplying } from './core/linear-aggregation';
import { named, namespace } from './core/names';
import { op } from './core/op';
import { sideEffect } from './core/util';
import { bomEntry } from './domain/bom';
import { quantified, quantifiedList } from './domain/quantification';
import { tocEntry } from './domain/toc';
import {
    image,
    svgRoot,
    transform,
    wrapVisualization
} from './domain/visualization';
import { workbench } from './domain/workbench';

export const t = {
    // primitives
    string,
    textarea,
    integer,
    number,
    boolean,
    date,
    time,
    unit,
    // structural
    group,
    member,
    unlabelledMember,
    labeled,
    panel,
    html,
    accordion,
    tabs,
    table,
    column,
    fixedTable,
    row,
    // select / either
    select,
    either,
    option,
    defaultOption,
    selected,
    unansweredOption,
    // validation
    validate,
    validationMessages,
    // core combinators
    op,
    sideEffect,
    named,
    namespace,
    linearAggregation,
    multiplying,
    // domain
    quantified,
    quantifiedList,
    bomEntry,
    tocEntry,
    workbench,
    image,
    svgRoot,
    transform,
    wrapVisualization
} as const;
