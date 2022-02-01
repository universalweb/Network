(async () => {
	const {
		request,
		utility: {
			assign,
			last,
		},
	} = app;
	exports.feed = {
		async search(searchRequest, options) {
			const {
				type,
				searchProp,
				build,
				feedProp,
				moreProp,
				extras,
				source,
				facility,
				organization,
				batch,
				product,
				code,
			} = options;
			const search = source.get(searchProp);
			if (!search || !search.trim()) {
				return;
			}
			console.log(search, searchRequest);
			const query = {
				type,
				search,
				item: {
					_id: await source.get(moreProp)
				}
			};
			if (build) {
				assign(query, await build());
			}
			const output = {};
			const results = await request(searchRequest, assign(query, extras || {
				product,
				batch,
				facility,
				organization,
				code,
			}));
			console.log(feedProp);
			if (feedProp) {
				await source.syncCollection(feedProp, results.items, 'push', '_id');
			}
			assign(output, results);
			console.log('search', results);
			if (results.loadMore) {
				output.loadMore = last(results.items)._id;
			} else {
				output.loadMore = false;
			}
			if (moreProp) {
				await source.set(moreProp, output.loadMore);
			}
			return output;
		},
		async load(loadRequest, options) {
			const {
				build,
				source,
				feedProp,
				moreProp,
				fresh,
				debounced,
				product,
				batch,
				facility,
				organization,
				type,
				code,
			} = options;
			debounced.clear();
			if (fresh) {
				await source.set(moreProp, false);
				await source.clearArray(feedProp);
			}
			const query = {
				type,
				item: {
					_id: await source.get(moreProp)
				}
			};
			const output = {};
			const results = await request(loadRequest, assign(query, build || {
				product,
				batch,
				facility,
				organization,
				code,
			}));
			if (feedProp) {
				await source.syncCollection(feedProp, results.items, 'push', '_id');
			}
			assign(output, results);
			console.log('search', results);
			if (results.loadMore) {
				output.loadMore = last(results.items)._id;
			} else {
				output.loadMore = false;
			}
			if (moreProp) {
				await source.set(moreProp, output.loadMore);
			}
			return output;
		}
	};
})();
