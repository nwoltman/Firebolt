test("String.prototype.endsWith", function() {
	var str = "Who am I, Gamling?";

	//True
	ok(str.endsWith("Gamling?"));				// 1
	ok(str.endsWith("Gamling?", 99));			// 2
	ok(str.endsWith("Gamling?", str.length));	// 3
	ok(str.endsWith("am I", 8));				// 4
	ok(str.endsWith("a", 5));					// 5

	//False
	equal(str.endsWith("Gamling?", -1), false);	// 6
	equal(str.endsWith("am I"), false);			// 7
	equal(str.endsWith("am I", 9), false);		// 8
	equal(str.endsWith("am I", 7), false);		// 9
	equal(str.endsWith("a", 6), false);			// 10
	equal(str.endsWith("a", 4), false);			// 11
});

test("String.prototype.repeat", function() {
	expect(7);

	var str = "abc";

	//Test return value
	equal(str.repeat(), "");			// 1
	equal(str.repeat(0), "");			// 2
	equal(str.repeat(1), "abc");		// 3
	equal(str.repeat(2), "abcabc");		// 4
	equal(str.repeat(2.5), "abcabc");	// 5

	//Test for throwing errors

	// 6
	try {
		str.repeat(-1);
	}
	catch (e) {
		ok(true);
	}

	// 7
	try {
		str.repeat(1/0);
	}
	catch (e) {
		ok(true);
	}
});

test("String.prototype.startsWith", function() {
	var str = "Who am I, Gamling?";

	//True
	ok(str.startsWith("Who"));		// 1
	ok(str.startsWith("am I", 4));	// 2

	//False
	ok(!str.startsWith("Who are"));	// 3
	ok(!str.startsWith("am I"));	// 4
});