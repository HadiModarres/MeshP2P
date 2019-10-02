REPORTER = dot

test:
	@./node_modules/.bin/jasmine-node test

test-cov:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/jasmine-node test

clean:
	rm -rf ./lib
	rm -rf ./node_modules
	rm -rf ./coverage

.PHONY: test
