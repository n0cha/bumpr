const Speech = {
	_language: 'nl-NL',
	_numbers: {
		'nl-NL': {
			een: 1,
			twee: 2,
			drie: 3,
			vier: 4,
			vijf: 5,
			zes: 6,
			zeven: 7,
			acht: 8,
			negen: 9
		}
	},
	
	getLicense(callback) {
		console.log('getLicense');
		
		SpeechApi.listen(transcript => {
			console.log('parseLicense');
			const words = transcript.split(' ');
			let result = '';
			_.each(words, word => {
				const number = this._numbers[this._language][word];
				if (number) {
					result += number;
					return;
				}
				if (word.match(/^[0-9A-Z]+$/)) {
					result += word;
					return;
				}
				if (word.match(/^[A-Za-z][a-z]+$/)) {
					result += word.charAt(0);
				}
			});
			
			callback(result.toUpperCase());
		});
	},
	
	getAction(callback) {
		console.log('getAction');
		
		SpeechApi.listen(transcript => {
			console.log('parseAction');
			transcript = transcript.toLowerCase();
			callback(transcript);
		}, 'en-GB');
	},
	
	stop() {
		SpeechApi.abort();
	}
};
