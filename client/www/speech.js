const Speech = {
	_phase: 0,
	_language: 'nl-NL',
	_available: false,
	_useHTML5: false,
	_html5Class: '',
	_speechRecognition: null,
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
	
	check(callback) {
		if (!window.plugins.speechRecognition) {
			return this.checkHtml5(callback);
		}
		
		window.plugins.speechRecognition.isRecognitionAvailable(isAvailable => {
			if (!isAvailable) {
				return this.checkHtml5(callback);
			}
			
			window.plugins.speechRecognition.hasPermission(isGranted => {
				if (isGranted) {
					this._available = true;
					return callback(this._available);
				}
				
				window.plugins.speechRecognition.requestPermission(() => {
					this._available = true;
					return callback(this._available);
				}, () => {
					return this.checkHtml5(callback);
				});
			});
		}, error => {
			return this.checkHtml5(callback);
		});
	},
	
	checkHtml5(callback) {
		if (window.SpeechRecognition) {
			this._html5Class = 'SpeechRecognition';
			this._useHTML5 = true;
			this._available = true;
		}
		
		if (window.webkitSpeechRecognition) {
			this._html5Class = 'webkitSpeechRecognition';
			this._useHTML5 = true;
			this._available = true;
		}
		
		return callback(this._available);
	},
	
	listen(callback, language) {
		language = language || this._language;
		
		$('#speechToggle').addClass('_enabled');
		
		const done = transcript => {
			$('#speechToggle').removeClass('_enabled');
			if (transcript) {
				console.log(transcript);
				callback(transcript);
			} else {
				this.listen(callback, language);
			}
		};
		
		if (this._useHTML5) {
			const recognition = new window[this._html5Class]();
			recognition.lang = language;
			recognition.onresult = event => {
				let transcript = event.results[0][0].transcript;
				done(transcript);
			};
			//recognition.onend = () => {
			//	this.start();
			//};
			recognition.start();
			this._speechRecognition = recognition;
		} else {
			window.plugins.speechRecognition.startListening(result => {
				done(result[0]);
			}, error => {
				showError(error);
			}, {
				language,
				showPopup: false
			});
		}
	},
	
	getLicense() {
		$('#plateNumber input').val('');
		showMessage('Listening, please speak license plate number.');
		this.listen(this.parseLicense.bind(this));
	},
	
	parseLicense(transcript) {
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
		if (result) {
			$('#plateNumber input').val(result.toUpperCase());
			this.getAction();
		} else {
			this.getLicense();
		}
	},
	
	getAction() {
		showMessage('Please say "like", "dislike", "oops" or "stop".');
		this.listen(this.parseAction.bind(this), 'en-GB');
	},
	
	parseAction(transcript) {
		transcript = transcript.toLowerCase();
		switch (transcript) {
			case 'like':
				thumbsUpButtonOnclick();
				this.stop();
				break;
			case 'dislike':
				thumbsDownButtonOnclick();
				this.stop();
				break;
			case 'oops':
				getLicense();
				break;
			case 'stop':
				this.stop();
				break;
		}
	},
	
	stop() {
		if (this._useHTML5) {
			if (this._speechRecognition) {
				this._speechRecognition.abort();
			}
		}
	}
};
