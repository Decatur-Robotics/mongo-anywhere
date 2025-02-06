import LocalStorageMock from "../src/LocalStorageMock";

test(`${LocalStorageMock.name}.${LocalStorageMock.prototype.setItem.name}: Sets and gets item`, () => {
	const key = "key";
	const value = { test: "value" };

	const localStorage = new LocalStorageMock();
	localStorage.setItem(key, value);

	expect(localStorage.getItem(key)).toStrictEqual(value);
});

test(`${LocalStorageMock.name}.${LocalStorageMock.prototype.removeItem.name}: Removes item`, () => {
	const key = "key";
	const value = { test: "value" };

	const localStorage = new LocalStorageMock();
	localStorage.setItem(key, value);

	localStorage.removeItem(key);

	expect(localStorage.getItem(key)).toBeUndefined();
});

test(`${LocalStorageMock.name}.${LocalStorageMock.prototype.clear.name}: Clears all items`, () => {
	const localStorage = new LocalStorageMock();

	localStorage.setItem("key1", { test: "value1" });
	localStorage.setItem("key2", { test: "value2" });

	localStorage.clear();

	expect(localStorage.getItem("key1")).toBeUndefined();
	expect(localStorage.getItem("key2")).toBeUndefined();
});

test(`${LocalStorageMock.name}.${LocalStorageMock.prototype.key}: Returns key at index`, () => {
	const localStorage = new LocalStorageMock();

	localStorage.setItem("key1", { test: "value1" });
	localStorage.setItem("key2", { test: "value2" });

	expect(localStorage.key(0)).toBe("key1");
	expect(localStorage.key(1)).toBe("key2");
});

test(`${LocalStorageMock.name}.${LocalStorageMock.prototype.length}: Returns number of items`, () => {
	const localStorage = new LocalStorageMock();

	expect(localStorage.length).toBe(0);

	localStorage.setItem("key1", { test: "value1" });
	localStorage.setItem("key2", { test: "value2" });

	expect(localStorage.length).toBe(2);
});
