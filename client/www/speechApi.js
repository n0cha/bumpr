const SpeechApi = {
	_language: 'nl-NL',
	_available: false,
	_useHTML5: false,
	_html5Class: '',
	_speechRecognition: null,
	
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
		
		if (this._useHTML5) {
			const recognition = new window[this._html5Class]();
			recognition.lang = language;
			let transcript = '';
			recognition.onresult = event => {
				transcript = event.results[0][0].transcript;
				recognition.stop();
			};
			recognition.onend = () => _.defer(() => callback(transcript));
			recognition.start();
			this._speechRecognition = recognition;
		} else {
			window.plugins.speechRecognition.startListening(result => {
				callback(result[0]);
			}, error => {
				showError(error);
			}, {
				language,
				showPopup: false
			});
		}
	},
	
	abort() {
		if (this._useHTML5) {
			if (this._speechRecognition) {
				this._speechRecognition.abort();
			}
		}
	}
};
