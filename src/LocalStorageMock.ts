import { serialize } from 'bson';
import { deserialize } from './utils';
export default class {
  private store: { [key: string]: string };

	constructor() {
		this.store = {};
	}

	clear() {
		this.store = {};
	}

	getItem(key: string) {
		return deserialize(JSON.parse(this.store[key] || ""));
	}

	setItem(key: string, value: object) {
		this.store[key] = JSON.stringify(serialize(value));
	}

	removeItem(key: string) {
		delete this.store[key];
	}
}