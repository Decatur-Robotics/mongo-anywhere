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
				if (typeof item === "object") {
					return removeUndefinedValues(item);
				}
				return item;
			});
		} else if (
			newObj[key] !== undefined &&
			!(newObj[key] instanceof ObjectId) &&
			newObj[key] !== null &&
			typeof newObj[key] === "object"
		) {
			newObj[key] = removeUndefinedValues(newObj[key]);
		}
	}

	return newObj;
}

export function replaceOidOperator(
	obj: { [key: string]: any },
	idsToString: boolean,
): { [key: string]: any } {
	const newObj = { ...obj };

	for (const key in newObj) {
		if (idsToString && key === "_id") {
			newObj["_id"] = newObj._id.$oid;
		} else if (!idsToString && key === "_id") {
			newObj._id = new ObjectId(newObj._id.toString());
		} else if (
			(idsToString && (key as any) instanceof ObjectId) ||
			newObj[key].$oid
		) {
			newObj[key] = `ObjectId:${newObj[key].$oid}`;
		} else if (
			!idsToString &&
			typeof newObj[key] === "string" &&
			newObj[key].startsWith("ObjectId:") &&
			newObj[key].slice(9).length === 24
		) {
			newObj[key] = new ObjectId(newObj[key].slice(9));
		} else if (Array.isArray(newObj[key])) {
			newObj[key] = newObj[key].map((item: any) => {
				if (typeof item === "object") {
					return replaceOidOperator(item, idsToString);
				}
				return item;
			});
		} else if (
			newObj[key] !== undefined &&
			!(newObj[key] instanceof ObjectId) &&
			newObj[key] !== null &&
			typeof newObj[key] === "object"
		) {
			newObj[key] = replaceOidOperator(newObj[key], idsToString);
		}
	}

	return newObj;
}

/**
 * @param removeUndefined pass false if you're serializing a query where undefined values are important
 * (this is most of the time that you're serializing a query)
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
