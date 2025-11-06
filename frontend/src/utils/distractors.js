/*
	distractors.js
	Local-only distractor utilities for MultipleChoice game.
	- generateDistractorsForPair(pair, count): return up to count plausible wrong answers (heuristic)
	- buildQuestionsFromPairs(pairs, {optionsCount}): build question objects with exactly optionsCount entries
	- normalizeText / shuffle helpers
*/

function shuffle(arr) {
	const a = Array.from(arr || []);
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function normalizeText(s) {
	const str = String(s || '');
	try {
		return str.normalize('NFKD').replace(/\p{M}/gu, '').replace(/['"(),.:;!?-]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
	} catch (e) {
		void e;
		return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['"(),.:;!?-]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
	}
}

export function generateDistractorsForPair(pair, count = 3) {
	const correct = String(pair.definition || pair.correct || '').trim();
	const isVietnamese = Array.from(correct).some((ch) => ch.charCodeAt(0) > 127);

	const viPool = ['ăn', 'uống', 'đọc', 'viết', 'chạy', 'ngủ', 'nghe', 'nói', 'bật', 'tắt', 'mua', 'bán'];
	const enPool = ['eat', 'drink', 'read', 'write', 'run', 'sleep', 'listen', 'speak', 'open', 'close', 'buy', 'sell'];
	const basePool = isVietnamese ? viPool : enPool;

	const picks = new Set();
	// if no correct provided, return random base pool items
	if (!correct) {
		for (const p of basePool) {
			picks.add(p);
			if (picks.size >= count) break;
		}
		return Array.from(picks).slice(0, count);
	}

	// Basic perturbations: replace last token, append an adverb, swap last two words
	const parts = correct.split(/\s+/).filter(Boolean);
	// Replace last token with other base nouns/verbs
	for (const b of basePool) {
		if (picks.size >= count) break;
		const cand = parts.length > 1 ? parts.slice(0, -1).concat([b]).join(' ') : b;
		if (normalizeText(cand) !== normalizeText(correct)) picks.add(cand);
	}
	// Add small perturbations
	if (picks.size < count) picks.add(parts.length > 1 ? parts.slice(0, -1).join(' ') : correct + ' khác');
	if (picks.size < count) picks.add(correct + ' nhanh');
	if (picks.size < count && parts.length > 1) {
		const sw = parts.slice();
		const n = sw.length;
		[sw[n - 1], sw[Math.max(0, n - 2)]] = [sw[Math.max(0, n - 2)], sw[n - 1]];
		picks.add(sw.join(' '));
	}

	// Return up to count unique items
	return Array.from(picks).filter(Boolean).slice(0, count);
}

export function buildQuestionsFromPairs(pairs, { optionsCount = 4 } = {}) {
	const wantWrong = Math.max(1, optionsCount - 1);
	return (pairs || []).map((p) => {
		const correct = String(p.definition || p.correct || '').trim();
		const seen = new Set();
		const wrongs = [];
		// collect wrongs (try a few rounds)
		let rounds = 0;
		while (wrongs.length < wantWrong && rounds < 6) {
			const candidates = generateDistractorsForPair(p, wantWrong - wrongs.length);
			for (const c of candidates) {
				const n = normalizeText(c);
				if (!n) continue;
				if (n === normalizeText(correct)) continue;
				if (!seen.has(n)) { seen.add(n); wrongs.push(c); }
				if (wrongs.length >= wantWrong) break;
			}
			rounds++;
		}
		// final pad with base pool if needed
		if (wrongs.length < wantWrong) {
			const pool = ['không', 'khác', 'một', 'hai', 'ba'];
			for (const x of pool) {
				if (wrongs.length >= wantWrong) break;
				const n = normalizeText(x);
				if (!seen.has(n) && n !== normalizeText(correct)) { seen.add(n); wrongs.push(x); }
			}
		}

		let options = shuffle([correct, ...wrongs]).slice(0, optionsCount);
		// ensure correct present
		if (!options.some((o) => normalizeText(o) === normalizeText(correct))) {
			options[0] = correct;
		}
		// final dedupe by normalized form, keep first occurrences
		const out = [];
		const outSeen = new Set();
		for (const o of options) {
			const n = normalizeText(o);
			if (!n) continue;
			if (!outSeen.has(n)) { outSeen.add(n); out.push(o); }
		}
		// pad if still short
		while (out.length < optionsCount) out.push('—');
		return { term: p.term || '', correct, options: out.slice(0, optionsCount) };
	});
}

export default { generateDistractorsForPair, buildQuestionsFromPairs, normalizeText, shuffle };
