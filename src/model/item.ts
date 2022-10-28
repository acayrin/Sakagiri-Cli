export type Item = {
	id: string; // item id
	name: string; // item name
	type: string; // item type
	sell: number; // item sell
	proc: number; // item process
	stats: string[]; // item stats
	drops: {
		from: string; // from which monster
		dyes: string[]; // optional dye color
	}[]; // item drops
	uses: {
		for: string; // target item id
		amount: number; // amount needed
	}[]; // item used for
	recipe: {
		// item recipe
		fee: number; // recipe fee
		set: number; // recipe set
		level: number; // recipe level
		difficulty: number; // recipe difficulty
		materials: any[]; // recipe materials
	};
};
