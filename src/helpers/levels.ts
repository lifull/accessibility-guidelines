export function getLevelTerm(level: number) {
	switch (level) {
		case 1:
			return "必ず達成";
		case 2:
			return "可能な限り達成";
		case 3:
			return "できれば考慮";
	}
}
