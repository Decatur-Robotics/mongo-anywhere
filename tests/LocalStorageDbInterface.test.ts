import { ObjectId } from "bson";
import LocalStorageDbInterface from "../src/LocalStorageDbInterface";
import LocalStorageMock from "../src/LocalStorageMock";

global.window = {
	localStorage: new LocalStorageMock(),
} as any;

enum CollectionId {
	Users = "Users",
	Accounts = "Accounts",
}

type User = {
	_id: ObjectId;
	name: string;
};

async function getTestApiUtils() {
	const db = await getDb();
	const user = { _id: new ObjectId(), name: "Test User" };
	return { db, user };
}

async function getDb() {
	const db = new LocalStorageDbInterface();
	await db.init(Object.values(CollectionId));
	return db;
}

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.init.name}: Initializes collections`, async () => {
	const db = new LocalStorageDbInterface();
	await db.init(Object.values(CollectionId));
	expect(Object.keys(db.backingDb.collections)).toStrictEqual(
		Object.values(CollectionId),
	);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.addObject.name}: Adds object`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.deleteObjectById.name}: Deletes object by id`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	await db.deleteObjectById(CollectionId.Users, user._id as any as ObjectId);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(0);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.updateObjectById.name}: Updates object`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	const updated = { name: "Updated User" };
	await db.updateObjectById(
		CollectionId.Users,
		user._id as any as ObjectId,
		updated,
	);

	expect(
		await db.findObjectById(CollectionId.Users, user._id as any as ObjectId),
	).toStrictEqual({ ...user, ...updated });
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObjectById.name}: Finds object by id`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);

	expect(
		await db.findObjectById(CollectionId.Users, user._id as any as ObjectId),
	).toStrictEqual(user);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObjectById.name}: Returns undefined if object not found`, async () => {
	const db = await getDb();

	expect(await db.findObjectById(CollectionId.Users, new ObjectId())).toBe(
		undefined,
	);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObject.name}: Finds object by query`, async () => {
	const { db, user } = await getTestApiUtils();
	await db.addObject(CollectionId.Users, user);
	expect(
		await db.findObject(CollectionId.Users, { name: user.name }),
	).toStrictEqual(user);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObject.name}: Returns undefined if object not found`, async () => {
	const db = await getDb();

	expect(await db.findObject(CollectionId.Users, { name: "Not Found" })).toBe(
		undefined,
	);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObjects.name}: Finds multiple objects by query`, async () => {
	const db = await getDb();

	const objects = [
		{ _id: new ObjectId(), name: "Test User", group: 1 },
		{ _id: new ObjectId(), name: "Test User 2", group: 1 },
		{ _id: new ObjectId(), name: "Test User 3", group: 2 },
	];

	for (const object of objects) {
		await db.addObject(CollectionId.Users, object as any as User);
	}

	expect(await db.findObjects(CollectionId.Users, { group: 1 })).toStrictEqual(
		objects.filter((o) => o.group === 1),
	);
	expect(
		await db.findObjects(CollectionId.Users, { name: objects[0].name }),
	).toStrictEqual([objects[0]]);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.findObjects.name}: Returns empty array if objects not found`, async () => {
	const db = await getDb();

	expect(
		await db.findObjects(CollectionId.Users, { name: "Not Found" }),
	).toStrictEqual([]);
});

test(`${LocalStorageDbInterface.name}.${LocalStorageDbInterface.prototype.countObjects.name}: Counts objects`, async () => {
	const { user } = await getTestApiUtils();
	// User is automatically added to the DB in getTestApiUtils, so we need to create a fresh DB
	const db = await getDb();
	expect(await db.countObjects(CollectionId.Users, {})).toBe(0);

	await db.addObject(CollectionId.Users, user);
	expect(await db.countObjects(CollectionId.Users, {})).toBe(1);
});
