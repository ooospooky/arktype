import type { IntersectionNode } from "../roots/intersection.ts"
import type { BaseRoot } from "../roots/root.ts"
import type { BaseErrorContext, declareNode } from "../shared/declare.ts"
import {
	implementNode,
	type nodeImplementationOf
} from "../shared/implement.ts"
import type { JsonSchema } from "../shared/jsonSchema.ts"
import { $ark } from "../shared/registry.ts"
import type { TraverseAllows } from "../shared/traversal.ts"
import {
	BaseRange,
	parseExclusiveKey,
	parseSizeLiteral,
	type BaseRangeInner,
	type UnknownExpandedRangeSchema
} from "./range.ts"

export declare namespace MinSize {
	export interface Inner extends BaseRangeInner {
		rule: number
		unit?: string
		originalValue?: number
		exclusive?: true
	}

	export interface SizeLiteralSchema extends UnknownExpandedRangeSchema {
		rule: string
		unit?: string
		originalValue?: number
	}

	export interface NormalizedSchema extends UnknownExpandedRangeSchema {
		rule: number
		unit?: string
		originalValue?: number
	}

	export type Schema = NormalizedSchema | SizeLiteralSchema | number | string

	export interface ErrorContext extends BaseErrorContext<"minSize">, Inner {}

	export interface Declaration
		extends declareNode<{
			kind: "minSize"
			schema: Schema
			normalizedSchema: NormalizedSchema
			inner: Inner
			prerequisite: File
			reducibleTo: "intersection"
			errorContext: ErrorContext
		}> {}

	export type Node = MinSizeNode
}

const implementation: nodeImplementationOf<MinSize.Declaration> =
	implementNode<MinSize.Declaration>({
		kind: "minSize",
		collapsibleKey: "rule",
		hasAssociatedError: true,
		keys: {
			rule: {},
			exclusive: parseExclusiveKey,
			originalValue: {},
			unit: {}
		},
		reduce: inner =>
			inner.rule === 0 ?
				// a minimum length of zero is trivially satisfied
				($ark.intrinsic.File as IntersectionNode)
			:	undefined,
		normalize: schema => {
			if (typeof schema === "number") return { rule: schema }

			if (typeof schema === "string") {
				const parsed = parseSizeLiteral(schema)
				return {
					rule: parsed.bytes,
					unit: parsed.unit,
					originalValue: parsed.originalValue
				}
			}

			if (typeof schema.rule === "number")
				return { ...schema, rule: schema.rule }

			const parsed = parseSizeLiteral(schema.rule)
			return {
				...schema,
				rule: parsed.bytes,
				unit: parsed.unit,
				originalValue: parsed.originalValue
			}
		},
		defaults: {
			description: node => {
				if (node.rule === 0)
					return node.exclusive ? "positive size" : "non-negative size"

				const displayValue =
					node.originalValue && node.unit ?
						`${node.originalValue}${node.unit}`
					:	`${node.rule} bytes`

				return `${node.exclusive ? "more than" : "at least"} ${displayValue}`
			},
			actual: data => `${data.size} bytes`
		},
		intersections: {
			minSize: (l, r) => (l.isStricterThan(r) ? l : r)
		},
		obviatesBasisDescription: true
	})

export class MinSizeNode extends BaseRange<MinSize.Declaration> {
	readonly impliedBasis: BaseRoot = $ark.intrinsic.File.internal

	readonly expression: string =
		this.originalValue && this.unit ?
			`${this.comparator} ${this.originalValue}${this.unit}`
		:	`${this.comparator} ${this.rule}`

	traverseAllows: TraverseAllows<File> =
		this.exclusive ?
			data => data.size > this.rule
		:	data => data.size >= this.rule

	reduceJsonSchema(schema: JsonSchema): JsonSchema {
		return schema
	}
}

export const MinSize = {
	implementation,
	Node: MinSizeNode
}
