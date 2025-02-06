import { deserialize, serialize } from "./utils";

/**
 * Does not actually persist data!
 */
class LocalStorageMock {
	[key: string | symbol]: any;

	private store: { [key: string]: string };

	constructor() {
		this.store = {};
	}

	clear() {
		this.store = {};
	}

	getItem(key: string) {
		const val = this.store[key];
		if (!val) {
			return undefined;
		}
		return deserialize(JSON.parse(val));
	}

	setItem(key: string, value: object) {
		this.store[key] = JSON.stringify(serialize(value));
	}

	removeItem(key: string) {
		delete this.store[key];
	}

	key(index: number) {
		return Object.keys(this.store)[index];
	}

	get length() {
		return Object.keys(this.store ?? {}).length;
	}
}

export default LocalStorageMock;
