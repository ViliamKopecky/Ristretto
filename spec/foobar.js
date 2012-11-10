describe('Foobar', function() {

	var foobar = new Foobar();

	it('metod foo should return "foo" when with right amount of "o"', function() {
		expect(foobar.foo(1)).toBe("fo");
		expect(foobar.foo(2)).toBe("foo");
		expect(foobar.foo(10)).toBe("foooooooooo");
	});

	it('metod foo should return empty string when passed 0 or null', function() {
		expect(foobar.foo(0)).toBe("");
		expect(foobar.foo(null)).toBe("");
	});

	it('metod foo should return empty string when passed negative number', function() {
		expect(foobar.foo(-1)).toBe("");
		expect(foobar.foo(-0)).toBe("");
		expect(foobar.foo(-5)).toBe("");
	});

});