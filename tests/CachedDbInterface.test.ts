import { ObjectId } from "bson";
import CachedDbInterface, { getCacheKey } from "../src/CachedDbInterface";

beforeEach(() => {
	global.cache = undefined;
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.init.name}`, () => {
	test("initializes the fallback db", async () => {
		const fallbackDb = {
			init: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		expect(fallbackDb.init).toHaveBeenCalledWith([
			"collection1",
			"collection2",
		]);
	});

	test("initializes the cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		expect(global.cache).toBeDefined();
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.addObject.name}`, () => {
	test("adds object to cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			addObject: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const object = { _id: new ObjectId(), name: "name" };
		await cachedDb.addObject("collection1", object);

		expect(
			global.cache!.get(
				getCacheKey("findOne", "collection1", object._id!.toString()),
			),
		).toEqual(object);
	});

	test("adds object to fallback db", async () => {
		const fallbackDb = {
			init: jest.fn(),
			addObject: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const object = { _id: new ObjectId(), name: "name" };
		await cachedDb.addObject("collection1", object);

		expect(fallbackDb.addObject).toHaveBeenCalledWith("collection1", object);
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.deleteObjectById.name}`, () => {
	test("deletes object from cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			deleteObjectById: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const id = new ObjectId();
		const key = getCacheKey("findOne", "collection1", id.toString());
		global.cache!.set(key, {});

		await cachedDb.deleteObjectById("collection1", id);

		expect(global.cache!.get(key)).toBeUndefined();
	});

	test("deletes object from fallback db", async () => {
		const fallbackDb = {
			init: jest.fn(),
			deleteObjectById: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const id = new ObjectId();
		await cachedDb.deleteObjectById("collection1", id);

		expect(fallbackDb.deleteObjectById).toHaveBeenCalledWith("collection1", id);
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.updateObjectById.name}`, () => {
	test("updates object in cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			updateObjectById: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const id = new ObjectId();
		const object = { _id: id, name: "name" };
		const key = getCacheKey("findOne", "collection1", id.toString());
		global.cache!.set(key, object);

		await cachedDb.updateObjectById("collection1", id, { name: "newName" });

		expect(global.cache!.get(key)).toEqual({
			_id: id,
			name: "newName",
		});
	});

	test("updates object in fallback db", async () => {
		const fallbackDb = {
			init: jest.fn(),
			updateObjectById: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const id = new ObjectId();
		await cachedDb.updateObjectById("collection1", id, { name: "newName" });

		expect(fallbackDb.updateObjectById).toHaveBeenCalledWith(
			"collection1",
			id,
			{ name: "newName" },
		);
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.findObjectById.name}`, () => {
	test("returns object from cache without using the fallback DB", async () => {
		const fallbackDb = {
			init: jest.fn(),
			findObjectById: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const id = new ObjectId();
		const object = { _id: id, name: "name" };
		global.cache!.set(
			getCacheKey("findOne", "collection1", id.toString()),
			object,
		);

		const result = await cachedDb.findObjectById("collection1", id);

		expect(result).toEqual(object);
		expect(fallbackDb.findObjectById).not.toHaveBeenCalled();
	});

	test("returns object from fallback DB if not in cache", async () => {
		const id = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObjectById: jest.fn().mockResolvedValue({ _id: id, name: "name" }),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const result = await cachedDb.findObjectById("collection1", id);

		expect(result).toEqual({ _id: id, name: "name" });
		expect(fallbackDb.findObjectById).toHaveBeenCalledWith("collection1", id);
	});

	test("caches the object if found in the fallback DB", async () => {
		const id = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObjectById: jest.fn().mockResolvedValue({ _id: id, name: "name" }),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		await cachedDb.findObjectById("collection1", id);

		expect(
			global.cache!.get(getCacheKey("findOne", "collection1", id.toString())),
		).toEqual({
			_id: id,
			name: "name",
		});
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.findObject.name}`, () => {
	test("returns objects from cache without using the fallback DB", async () => {
		const fallbackDb = {
			init: jest.fn(),
			findObject: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const query = { name: "name" };
		const object = { _id: new ObjectId(), name: query.name };
		global.cache!.set(getCacheKey("findOne", "collection1", query), object);

		const result = await cachedDb.findObject("collection1", query);

		expect(result).toEqual(object);
	});

	test("returns object from fallback DB if not in cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			findObject: jest
				.fn()
				.mockResolvedValue({ _id: new ObjectId(), name: "name" }),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const result = await cachedDb.findObject("collection1", { name: "name" });

		expect(result).toEqual({ _id: expect.any(ObjectId), name: "name" });
		expect(fallbackDb.findObject).toHaveBeenCalledWith("collection1", {
			name: "name",
		});
	});

	test("caches the object if found in the fallback DB", async () => {
		const id = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObject: jest.fn().mockResolvedValue({ _id: id, name: "name" }),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const query = { name: "name" };
		await cachedDb.findObject("collection1", query);

		expect(
			global.cache!.get(getCacheKey("findOne", "collection1", query)),
		).toEqual({ _id: id, name: "name" });
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.findObjects.name}`, () => {
	test("returns objects from cache without using the fallback DB", async () => {
		const fallbackDb = {
			init: jest.fn(),
			findObjects: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const query = { name: "name" };
		const objects: { _id: ObjectId; name: string }[] = [];
		for (let i = 0; i < 5; i++) {
			const obj = { _id: new ObjectId(), name: query.name };
			objects.push(obj);
			global.cache!.set(
				getCacheKey("findOne", "collection1", obj._id.toString()),
				obj,
			);
		}

		global.cache!.set(
			getCacheKey("findMultiple", "collection1", query),
			objects.map((obj) => obj._id),
		);

		const result = await cachedDb.findObjects("collection1", query);

		expect(result).toEqual(objects);
		expect(fallbackDb.findObjects).not.toHaveBeenCalled();
	});

	test("returns objects from fallback DB if not in cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			findObjects: jest
				.fn()
				.mockResolvedValue([{ _id: new ObjectId(), name: "name" }]),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const result = await cachedDb.findObjects("collection1", { name: "name" });

		expect(result).toEqual([{ _id: expect.any(ObjectId), name: "name" }]);
		expect(fallbackDb.findObjects).toHaveBeenCalledWith("collection1", {
			name: "name",
		});
	});

	test("caches the objects if found in the fallback DB", async () => {
		const id = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObjects: jest.fn().mockResolvedValue([{ _id: id, name: "name" }]),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const query = { name: "name" };
		await cachedDb.findObjects("collection1", query);

		expect(
			global.cache!.get(getCacheKey("findMultiple", "collection1", query)),
		).toEqual([id]);
	});

	test("finds individual objects from fallback DB if some are not in cache", async () => {
		const id1 = new ObjectId();
		const id2 = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObjects: jest.fn().mockResolvedValue([
				{ _id: id1, name: "name" },
				{ _id: id2, name: "name" },
			]),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		global.cache!.set(getCacheKey("findOne", "collection1", id1.toString()), {
			_id: id1,
			name: "name",
		});

		global.cache!.set(getCacheKey("findMultiple", "collection1", [id1, id2]), [
			id1,
			id2,
		]);

		const result = await cachedDb.findObjects("collection1", { name: "name" });

		expect(result).toEqual([
			{ _id: id1, name: "name" },
			{ _id: id2, name: "name" },
		]);
	});

	test("caches individual objects if found in the fallback DB", async () => {
		const id1 = new ObjectId();
		const id2 = new ObjectId();
		const fallbackDb = {
			init: jest.fn(),
			findObjects: jest.fn().mockResolvedValue([
				{ _id: id1, name: "name" },
				{ _id: id2, name: "name" },
			]),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		global.cache!.set(getCacheKey("findOne", "collection1", id1.toString()), {
			_id: id1,
			name: "name",
		});

		global.cache!.set(getCacheKey("findMultiple", "collection1", [id1, id2]), [
			id1,
			id2,
		]);

		await cachedDb.findObjects("collection1", { name: "name" });

		expect(
			global.cache!.get(getCacheKey("findOne", "collection1", id2.toString())),
		).toEqual({ _id: id2, name: "name" });
	});
});

describe(`${CachedDbInterface.name}.${CachedDbInterface.prototype.countObjects.name}`, () => {
	test("returns count from cache without using the fallback DB", async () => {
		const fallbackDb = {
			init: jest.fn(),
			countObjects: jest.fn(),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const query = { name: "name" };
		global.cache!.set(getCacheKey("count", "collection1", query), 5);

		const result = await cachedDb.countObjects("collection1", query);

		expect(result).toBe(5);
		expect(fallbackDb.countObjects).not.toHaveBeenCalled();
	});

	test("returns count from fallback DB if not in cache", async () => {
		const fallbackDb = {
			init: jest.fn(),
			countObjects: jest.fn().mockResolvedValue(5),
		} as any;

		const cachedDb = new CachedDbInterface(fallbackDb, {});
		await cachedDb.init(["collection1", "collection2"]);

		const result = await cachedDb.countObjects("collection1", { name: "name" });

		expect(result).toBe(5);
		expect(fallbackDb.countObjects).toHaveBeenCalledWith("collection1", {
			name: "name",
		});
	});
});
