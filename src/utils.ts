import { EJSON, ObjectId } from "bson";

/**
 * Remove undefined values or EJSON will convert them to null
 */
export function removeUndefinedValues(obj: { [key: string]: any }): {
	[key: string]: any;
} {
	const newObj = { ...obj };

	for (const key in newObj) {
		if (newObj[key] === undefined) {
			delete newObj[key];
		} else if (Array.isArray(newObj[key])) {
			newObj[key] = newObj[key].map((item: any) => {
				if (typeof item === "object" && !(item instanceof ObjectId)) {
					return removeUndefinedValues(item);
				}
				return item;
			});
		} else if (
			newObj[key] !== undefined &&
			newObj[key] !== null &&
			typeof newObj[key] === "object" &&
			!(newObj[key] instanceof ObjectId)
		) {
			newObj[key] = removeUndefinedValues(newObj[key]);
		}
	}

	return newObj;
}

export function encodeSerializedObjectId(id: { $oid: string }): string {
	return `oid:${id.$oid.toString()}`;
}

export function decodeObjectId(id: string) {
	return new ObjectId(id.slice("oid:".length));
}

export function isSerializedObjectId(obj: any) {
	return (
		obj && typeof obj === "object" && obj.$oid && ObjectId.isValid(obj.$oid)
	);
}

export function isEncodedObjectId(obj: string) {
	return (
		typeof obj === "string" &&
		obj.startsWith("oid:") &&
		obj.length === "oid:".length + 24 &&
		ObjectId.isValid(obj.slice("oid:".length))
	);
}

function replaceOidOperatorForValue(value: any, idsToString: boolean): any {
	if (idsToString && isSerializedObjectId(value)) {
		return encodeSerializedObjectId(value);
	}
	if (!idsToString && isEncodedObjectId(value)) {
		return decodeObjectId(value);
	}
	return value;
}

export function replaceOidOperator(
	obj: { [key: string]: any },
	idsToString: boolean,
): { [key: string]: any } {
	const newObj = { ...obj };

	for (const key in newObj) {
		if (idsToString && isSerializedObjectId(newObj[key])) {
			newObj[key] = encodeSerializedObjectId(newObj[key]);
		} else if (!idsToString && isEncodedObjectId(newObj[key])) {
			newObj[key] = decodeObjectId(newObj[key]);
		} else if (Array.isArray(newObj[key])) {
			newObj[key] = newObj[key].map((item: any) => {
				if (idsToString && isSerializedObjectId(item)) {
					return encodeSerializedObjectId(item);
				}

				if (!idsToString && isEncodedObjectId(item)) {
					return decodeObjectId(item);
				}

				if (typeof item === "object") {
					return replaceOidOperator(item, idsToString);
				}

				return replaceOidOperatorForValue(item, idsToString);
			});
		} else if (newObj[key] != undefined && typeof newObj[key] === "object") {
			newObj[key] = replaceOidOperator(newObj[key], idsToString);
		} else newObj[key] = replaceOidOperatorForValue(newObj[key], idsToString);
	}

	return newObj;
}

/**
 * @param removeUndefined pass false if you're serializing a query where undefined values are important.
 * This will replace undefined with null.
 */
export function serialize(obj: any, removeUndefined: boolean = true): any {
	return replaceOidOperator(
		EJSON.serialize(removeUndefined ? removeUndefinedValues(obj) : obj),
		true,
	);
}

export function deserialize(obj: any): any {
	return replaceOidOperator(EJSON.deserialize(obj), false);
}

export function ensureObjHasId(obj: { _id?: ObjectId | string }): void {
	if (obj._id && typeof obj._id === "string") {
		obj._id = new ObjectId(obj._id);
	} else if (!obj._id) {
		obj._id = new ObjectId();
	}
}
