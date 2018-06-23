/**
 * @param id {string}
 * @param numRows {number}
 * @param numColumns {number}
 */
export function constructTable(
	id: string,
	numRows: number,
	numColumns: number,
	content: string = "0",
) {
	var createElement, i, j, table, tbody, tr, td;
	createElement = document.createElement.bind(document);
	table = document.getElementById(id);
	if (!table) {
		throw new Error(`Invalid selector #${id}!`);
	}
	tbody = table.querySelector("tbody");
	for (i = 0; i < numRows; i++) {
		tr = createElement("tr");
		tr.id = "row-" + i;
		for (j = 0; j < numColumns; j++) {
			td = createElement("td");
			td.textContent = content;
			td.id = "cell-" + (i * numColumns + j);
			td.classList.add("ram-cell");
			tr.appendChild(td);
		}
		tbody!.appendChild(tr);
	}
}
