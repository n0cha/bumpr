const Speech = {
	_phase: 0,
	_language: 'nl-NL',
	_available: false,
	_useHTML5: false,
	_html5Class: '',
	
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
			this._available = true;
		}
		
		if (window.webkitSpeechRecognition) {
			this._html5Class = 'webkitSpeechRecognition';
			this._available = true;
		}
		
		return callback(this._available);
	},
	
	toggle() {
		console.log('TOGGLE');
		if (this._phase) {
			this._phase = 0;
		} else {
			this._phase = 1;
		}
		this.start();
		$('#speechToggle').toggleClass('_enabled', this._phase);
	},
	
	nextPhase() {
		console.log('NEXTPHASE');
		this._phase++;
		if (this._phase > 2) {
			this.toggle();
		}
	},
	
	start() {
		console.log('START', this._phase);
		switch(this._phase) {
			case 1:
				showMessage('Listening, please speak license plate number.');
				break;
			case 2:
				showMessage('Please say "like", "dislike", "oops" or "stop".');
				break;
			default:
				//hideMessage();
				break;
		}
		
		if (!this._phase) {
			return;
		}
		
		const language = this._phase === 2 ? 'en-GB' : this._language;
		
		if (this._useHTML5) {
			const recognition = new window[this._html5Class]();
			recognition.lang = language;
			recognition.onresult = event => {
				console.log('ONRESULT');
				let transcript = event.results[0][0].transcript;
				console.log(transcript);
				this.parse(transcript);
			};
			recognition.onend = () => {
				console.log('ONEND');
				this.start();
			};
			recognition.start();
		} else {
			window.plugins.speechRecognition.startListening(result => {
				this.parse(result.join(' '));
			}, function(err){
				console.error(err);
			}, {
				language,
				showPopup: false
			});
		}
	},
	
	parse(transcript) {
		console.log('PARSE');
		switch (this._phase) {
			case 1:
				const words = transcript.split(' ');
				let result = '';
				_.each(words, word => {
					if (word.match(/^[0-9A-Z]+$/)) {
						result += word;
						return;
					}
					if (word.match(/^[A-Za-z][a-z]+$/)) {
						result += word.charAt(0);
					}
				});
				$('#plateNumber input').val(result.toUpperCase());
				this.nextPhase();
				break;
			case 2:
				transcript = transcript.toLowerCase();
				switch (transcript) {
					case 'like':
						thumbsUpButtonOnclick();
						this.nextPhase();
						break;
					case 'dislike':
						thumbsDownButtonOnclick();
						this.nextPhase();
						break;
					case 'oops':
						$('#plateNumber input').val('');
						break;
					case 'stop':
						this.toggle();
						break;
				}
		}
	}
};
