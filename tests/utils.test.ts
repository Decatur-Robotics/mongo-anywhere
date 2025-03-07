import { EJSON, ObjectId } from "bson";
import {
	decodeObjectId,
	deserialize,
	encodeSerializedObjectId,
	isEncodedObjectId,
	removeUndefinedValues,
	replaceOidOperator,
	serialize,
} from "../src/utils";

function newSerializedObjectId() {
	return EJSON.serialize(new ObjectId()) as { $oid: string };
}

describe(removeUndefinedValues.name, () => {
	test("Removes undefined values from an object", () => {
		const obj = {
			a: 1,
			b: undefined,
			c: {
				d: 2,
				e: undefined,
			},
		};

		expect(removeUndefinedValues(obj)).toEqual({
			a: 1,
			c: {
				d: 2,
			},
		});
	});

	test("Removes undefined values from nested objects", () => {
		const obj = {
			a: 1,
			b: undefined,
			c: {
				d: 2,
				e: {
					f: 3,
					g: undefined,
				},
			},
		};

		expect(removeUndefinedValues(obj)).toEqual({
			a: 1,
			c: {
				d: 2,
				e: {
					f: 3,
				},
			},
		});
	});

	test("Removes undefined values from an object inside an array", () => {
		const obj = {
			a: 1,
			b: undefined,
			c: [
				{
					d: 2,
					e: undefined,
				},
			],
		};

		expect(removeUndefinedValues(obj)).toEqual({
			a: 1,
			c: [
				{
					d: 2,
				},
			],
		});
	});
});

test(encodeSerializedObjectId.name, () => {
	const id = EJSON.serialize(new ObjectId()) as { $oid: string };
	expect(encodeSerializedObjectId(id)).toBe(`oid:${id.$oid.toString()}`);
});

test(decodeObjectId.name, () => {
	const id = new ObjectId();
	expect(decodeObjectId(`oid:${id.toString()}`)).toEqual(id);
	expect(decodeObjectId(`oid:${id.toString()}`)).toBeInstanceOf(ObjectId);
});

describe(isEncodedObjectId.name, () => {
	test("Returns true for encoded IDs", () => {
		const id = new ObjectId();
		expect(isEncodedObjectId(`oid:${id.toString()}`)).toBe(true);
	});

	test("Returns false for non-encoded IDs", () => {
		const id = new ObjectId();
		expect(isEncodedObjectId(id.toString())).toBe(false);
	});

	test("Returns false for invalid IDs", () => {
		expect(isEncodedObjectId("invalid")).toBe(false);
	});
});

describe(replaceOidOperator.name, () => {
	test("Replaces _id with oid", () => {
		const obj = {
			_id: newSerializedObjectId(),
		};

		expect(replaceOidOperator(obj, true)).toEqual({
			_id: encodeSerializedObjectId(obj._id),
		});
	});

	test("Replaces nested IDs", () => {
		const obj = {
			a: {
				id: newSerializedObjectId(),
			},
			b: {
				id: newSerializedObjectId(),
			},
		};

		expect(replaceOidOperator(obj, true)).toEqual({
			a: {
				id: encodeSerializedObjectId(obj.a.id),
			},
			b: {
				id: encodeSerializedObjectId(obj.b.id),
			},
		});
	});

	test("Replaces IDs inside arrays", () => {
		const obj = {
			a: [newSerializedObjectId(), newSerializedObjectId()],
		};

		expect(replaceOidOperator(obj, true)).toEqual({
			a: [
				encodeSerializedObjectId(obj.a[0]),
				encodeSerializedObjectId(obj.a[1]),
			],
		});
	});

	test("Replaces IDs inside objects inside arrays", () => {
		const obj = {
			a: [
				{
					id: newSerializedObjectId(),
				},
				{
					id: newSerializedObjectId(),
				},
			],
		};

		expect(replaceOidOperator(obj, true)).toEqual({
			a: [
				{
					id: encodeSerializedObjectId(obj.a[0].id),
				},
				{
					id: encodeSerializedObjectId(obj.a[1].id),
				},
			],
		});
	});
});

describe(serialize.name, () => {
	test("Removes undefined values by default", () => {
		const obj = {
			a: 1,
			b: undefined,
			c: {
				d: 2,
				e: undefined,
			},
		};

		expect(serialize(obj)).toEqual({
			a: 1,
			c: {
				d: 2,
			},
		});
	});

	test("Replaced undefined with null when removeUndefined is false", () => {
		const obj = {
			a: 1,
			b: undefined,
			c: {
				d: 2,
				e: undefined,
			},
		};

		expect(serialize(obj, false)).toEqual({
			a: 1,
			b: null,
			c: {
				d: 2,
				e: null,
			},
		});
	});

	test("Replaces _id with oid", () => {
		const obj = {
			_id: newSerializedObjectId(),
		};

		expect(serialize(obj)).toEqual({
			_id: encodeSerializedObjectId(obj._id),
		});
	});

	test("Replaces nested IDs", () => {
		const obj = {
			a: {
				id: newSerializedObjectId(),
			},
			b: {
				id: newSerializedObjectId(),
			},
		};

		expect(serialize(obj)).toEqual({
			a: {
				id: encodeSerializedObjectId(obj.a.id),
			},
			b: {
				id: encodeSerializedObjectId(obj.b.id),
			},
		});
	});

	test("Replaces IDs inside arrays", () => {
		const obj = {
			a: [newSerializedObjectId(), newSerializedObjectId()],
		};

		expect(serialize(obj)).toEqual({
			a: [
				encodeSerializedObjectId(obj.a[0]),
				encodeSerializedObjectId(obj.a[1]),
			],
		});
	});
});

describe(deserialize.name, () => {
	test("Replaces oid with _id", () => {
		const obj = {
			_id: encodeSerializedObjectId(newSerializedObjectId()),
		};

		expect(deserialize(obj)).toEqual({
			_id: decodeObjectId(obj._id),
		});
	});

	test("Replaces nested IDs", () => {
		const obj = {
			a: {
				id: encodeSerializedObjectId(newSerializedObjectId()),
			},
			b: {
				id: encodeSerializedObjectId(newSerializedObjectId()),
			},
		};

		expect(deserialize(obj)).toEqual({
			a: {
				id: decodeObjectId(obj.a.id),
			},
			b: {
				id: decodeObjectId(obj.b.id),
			},
		});
	});

	test("Replaces IDs inside arrays", () => {
		const obj = {
			a: [
				encodeSerializedObjectId(newSerializedObjectId()),
				encodeSerializedObjectId(newSerializedObjectId()),
			],
		};

		expect(deserialize(obj)).toEqual({
			a: [decodeObjectId(obj.a[0]), decodeObjectId(obj.a[1])],
		});
	});
});

test("serialize and deserialize are inverses", () => {
	const obj = {
		a: 1,
		b: undefined,
		c: {
			d: 2,
			e: undefined,
			f: new ObjectId(),
			g: [new ObjectId(), new ObjectId()],
		},
	};

	const serialized = serialize(obj);
	const deserialized = deserialize(serialized);

	delete obj.b;
	delete obj.c.e;

	expect(deserialized).not.toBe(obj);
	expect(deserialized).toEqual(obj);
});
