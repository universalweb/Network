import './registerRoots.js';
import { BootScreen } from '../components/global/boot-screen/boot-screen.js';
import { WebComponent } from 'webcomponent';
class PreviewView extends WebComponent {
	static id = 'preview-view';
	static url = import.meta.url;
	static styles = {
		preview: './preview.css',
	};
	static state = {
		emailValue: '',
		searchValue: '',
		amountValue: '',
		clickCount: 0,
		spinDemo: false,
		badgeCount: 1,
		confirmResult: '(awaiting action)',
	};
	static async create(state, config) {
		const view = new this(await state, config);
		await WebComponent.preRender(view, document.body);
		return view;
	}
	bumpClick() {
		this.state.clickCount = this.state.clickCount + 1;
	}
	bumpBadge() {
		this.state.badgeCount = this.state.badgeCount + 1;
	}
	toggleSpin() {
		this.state.spinDemo = !this.state.spinDemo;
	}
	syncEmail(domEvent) {
		this.state.emailValue = domEvent.detail.data.value;
	}
	syncSearch(domEvent) {
		this.state.searchValue = domEvent.detail.data.value;
	}
	syncAmount(domEvent) {
		this.state.amountValue = domEvent.detail.data.value;
	}
	openModal() {
		this.refs.modal.open();
	}
	closeModal() {
		this.refs.modal.close();
	}
	openControlsModal() {
		this.refs.controlsModal.open();
	}
	openMacModal() {
		this.refs.macModal.open();
	}
	openMaximizedStartModal() {
		// Demonstrates the afterAction continuation hook — fires once when
		// the modal closes, regardless of path (button, Escape, backdrop).
		this.refs.afterActionModal.assignState({
			afterAction: ({ returnValue }) => {
				this.state.confirmResult = `modal closed with returnValue=${returnValue || '(empty)'}`;
			},
		});
		this.refs.afterActionModal.open();
	}
	notifyDefault() {
		this.refs.notify.show({
			title: 'Heads up',
			message: 'A default notification just landed.',
		});
	}
	notifyError() {
		this.refs.notify.show({
			title: 'Transfer failed',
			message: 'The node rejected the transaction.',
			itemType: 'error',
		});
	}
	showLoadingScreen() {
		const loadingScreen = this.refs.loading;
		loadingScreen.open({
			title: 'Syncing chain',
			message: 'Verifying post-quantum proofs…',
		});
		this.setTimeout(() => {
			loadingScreen.close();
		}, 2000);
	}
	showBootScreen() {
		const bootScreen = new BootScreen();
		document.body.appendChild(bootScreen);
		this.setTimeout(() => {
			bootScreen.dismiss();
		}, 2200);
	}
	async doDestructiveAction() {
		const accepted = await this.confirm('Delete this wallet? This action cannot be undone.');
		const timestamp = new Date().toLocaleTimeString();
		this.state.confirmResult = accepted ? `confirmed at ${timestamp}` : `cancelled at ${timestamp}`;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="preview">
				<header class="preview-head">
					<ui-text variant="display" tone="accent">UI Component Preview</ui-text>
					<ui-text variant="caption" tone="muted">tier-0 atoms · viat / universal-web-components</ui-text>
				</header>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UISurface</ui-text>
						<ui-text variant="caption" tone="muted">tones · padding · radius · elevation · interactive</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="grid">
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
							}}><ui-text variant="caption" tone="muted">panel</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}><ui-text variant="caption" tone="muted">subtle</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'md',
								radius: 'md',
							}}><ui-text variant="caption" tone="muted">popup</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'success',
								padding: 'md',
								radius: 'md',
							}}><ui-text variant="caption" tone="muted">success</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'danger',
								padding: 'md',
								radius: 'md',
							}}><ui-text variant="caption" tone="muted">danger</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'accent',
								padding: 'md',
								radius: 'md',
								elevation: '2',
							}}><ui-text variant="caption" tone="muted">accent · elev 2</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
								elevation: '3',
								border: true,
							}}><ui-text variant="caption" tone="muted">panel · elev 3 · border</ui-text></ui-surface>
							<ui-surface .state=${{
								tone: 'panel',
								padding: 'md',
								radius: 'md',
								interactive: true,
								border: true,
							}}><ui-text variant="caption" tone="muted">interactive · hover</ui-text></ui-surface>
						</div>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIStack</ui-text>
						<ui-text variant="caption" tone="muted">flex layout · direction · gap · align · justify</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<div class="cluster">
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									direction: 'row',
									gap: 'sm',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-stack .state=${{
									direction: 'row',
									gap: 'lg',
									justify: 'between',
								}}>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">A</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">B</ui-text></ui-surface>
									<ui-surface .state=${{
										tone: 'accent',
										padding: 'sm',
										radius: 'sm',
									}}><ui-text variant="caption">C</ui-text></ui-surface>
								</ui-stack>
							</ui-surface>
						</div>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIText</ui-text>
						<ui-text variant="caption" tone="muted">variants · tones</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'sm',
						}}>
							<ui-text variant="display">Display heading</ui-text>
							<ui-text variant="h1">Heading 1</ui-text>
							<ui-text variant="h2">Heading 2</ui-text>
							<ui-text variant="h3" tone="accent">Heading 3 · accent</ui-text>
							<ui-text variant="body">Body copy stays readable at the comfortable default size.</ui-text>
							<ui-text variant="caption" tone="muted">Caption · muted tone for secondary info</ui-text>
							<ui-text variant="overline" tone="accent">overline · uppercase tracker</ui-text>
							<ui-text variant="mono">monospace_for_addresses_and_codes</ui-text>
							<ui-text variant="body" tone="success">success</ui-text>
							<ui-text variant="body" tone="warning">warning</ui-text>
							<ui-text variant="body" tone="danger">danger</ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIIcon</ui-text>
						<ui-text variant="caption" tone="muted">sizes · tones · spin</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-icon .state=${{
								name: 'star',
								size: 'xs',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'sm',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'md',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'lg',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'star',
								size: 'xl',
								tone: 'accent',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'circle-check',
								size: 'lg',
								tone: 'success',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'triangle-alert',
								size: 'lg',
								tone: 'warning',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'circle-x',
								size: 'lg',
								tone: 'danger',
							}}></ui-icon>
							<ui-icon .state=${{
								name: 'loader-circle',
								size: 'lg',
								spin: this.state.spinDemo,
							}}></ui-icon>
							<ui-button .state=${{
								label: this.state.spinDemo ? 'Stop' : 'Spin',
								tone: 'primary',
								variant: 'outline',
								size: 'sm',
							}} @buttonClick=${this.toggleSpin}></ui-button>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIButton</ui-text>
						<ui-text variant="caption" tone="muted">tones × variants × sizes · tap snap built in</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Solid neutral',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid primary',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid success',
									tone: 'success',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid danger',
									tone: 'danger',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Solid warning',
									tone: 'warning',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Outline neutral',
									variant: 'outline',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Outline primary',
									variant: 'outline',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Outline danger',
									variant: 'outline',
									tone: 'danger',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Ghost',
									variant: 'ghost',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Ghost primary',
									variant: 'ghost',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'Link',
									variant: 'link',
									tone: 'primary',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'XS',
									size: 'xs',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'SM',
									size: 'sm',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'MD',
									size: 'md',
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'LG',
									size: 'lg',
									tone: 'primary',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								wrap: true,
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Disabled',
									disabled: true,
								}}></ui-button>
								<ui-button .state=${{
									label: 'Loading',
									loading: true,
									tone: 'primary',
								}}></ui-button>
								<ui-button .state=${{
									label: 'With leading',
									tone: 'primary',
									leadicon: 'arrow-left',
								}}></ui-button>
								<ui-button .state=${{
									label: 'With trailing',
									tone: 'primary',
									trailicon: 'arrow-right',
								}}></ui-button>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-button .state=${{
									label: 'Click me',
									tone: 'primary',
								}} @buttonClick=${this.bumpClick}></ui-button>
								<ui-text variant="caption" tone="muted">clicks: ${this.state.clickCount}</ui-text>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIInput</ui-text>
						<ui-text variant="caption" tone="muted">sizes · tones · disabled · readonly</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'md',
								wrap: true,
							}}>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'sm size · email',
									size: 'sm',
								}} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'md size (default)',
									size: 'md',
								}} @input=${this.syncEmail}></ui-input>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'lg size',
									size: 'lg',
								}} @input=${this.syncEmail}></ui-input>
							</ui-stack>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'md',
								wrap: true,
							}}>
								<ui-input .state=${{
									placeholder: 'disabled',
									disabled: true,
								}}></ui-input>
								<ui-input .state=${{
									placeholder: 'readonly',
									value: 'cannot edit',
									readonly: true,
								}}></ui-input>
								<ui-input .state=${{
									placeholder: 'error tone',
									tone: 'error',
								}}></ui-input>
							</ui-stack>
							<ui-text variant="caption" tone="muted">live email value: <ui-text variant="mono">${this.state.emailValue || '(empty)'}</ui-text></ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIField</ui-text>
						<ui-text variant="caption" tone="muted">labelled wrapper · help · error · required</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-field .state=${{
								label: 'Email address',
								help: 'We\'ll never share your email.',
								required: true,
							}}>
								<ui-input .state=${{
									value: this.state.emailValue,
									type: 'email',
									placeholder: 'you@example.com',
								}} @input=${this.syncEmail}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Search',
								error: 'No results found',
							}}>
								<ui-input .state=${{
									value: this.state.searchValue,
									type: 'search',
									placeholder: 'try anything',
									tone: 'error',
								}} @input=${this.syncSearch}></ui-input>
							</ui-field>
							<ui-field .state=${{
								label: 'Amount',
								help: 'inline layout',
								inline: true,
							}}>
								<ui-input .state=${{
									value: this.state.amountValue,
									type: 'number',
									placeholder: '0.00',
								}} @input=${this.syncAmount}></ui-input>
							</ui-field>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIBadge</ui-text>
						<ui-text variant="caption" tone="muted">existing · entrance pop + value-change pulse</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'md',
							wrap: true,
							align: 'center',
						}}>
							<ui-badge .state=${{
								label: 'neutral',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'success',
								tone: 'success',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'warning',
								tone: 'warning',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'danger',
								tone: 'danger',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'info',
								tone: 'info',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'accent',
								tone: 'accent',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'small',
								tone: 'success',
								size: 'sm',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'large',
								tone: 'accent',
								size: 'lg',
							}}></ui-badge>
							<ui-badge .state=${{
								label: 'with dot',
								tone: 'success',
								dot: true,
							}}></ui-badge>
							<ui-stack .state=${{
								direction: 'row',
								gap: 'sm',
								align: 'center',
							}}>
								<ui-badge .state=${{
									label: String(this.state.badgeCount),
									tone: 'accent',
								}}></ui-badge>
								<ui-button .state=${{
									label: 'Bump (test pulse)',
									size: 'sm',
									variant: 'outline',
								}} @buttonClick=${this.bumpBadge}></ui-button>
							</ui-stack>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UISpinner</ui-text>
						<ui-text variant="caption" tone="muted">sizes · variants · label</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-spinner .state=${{
								size: 'sm',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'lg',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'xl',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
								variant: 'bars',
							}}></ui-spinner>
							<ui-spinner .state=${{
								size: 'md',
								label: 'Loading…',
							}}></ui-spinner>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UISkeleton</ui-text>
						<ui-text variant="caption" tone="muted">text · multi-line · circle · rect</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'lg',
							align: 'center',
							wrap: true,
						}}>
							<ui-skeleton .state=${{
								variant: 'circle',
								width: '48px',
								height: '48px',
							}}></ui-skeleton>
							<ui-skeleton .state=${{
								variant: 'rect',
								width: '120px',
								height: '64px',
								radius: '8px',
							}}></ui-skeleton>
							<ui-skeleton .state=${{
								variant: 'text',
								lines: 4,
								width: '240px',
							}}></ui-skeleton>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UILoadingBar</ui-text>
						<ui-text variant="caption" tone="muted">determinate · value label · indeterminate</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'md',
						}}>
							<ui-loading-bar .state=${{
								value: 35,
							}}></ui-loading-bar>
							<ui-loading-bar .state=${{
								value: 72,
								showValue: true,
							}}></ui-loading-bar>
							<ui-loading-bar .state=${{
								indeterminate: true,
								label: 'Working',
							}}></ui-loading-bar>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIEmptyState</ui-text>
						<ui-text variant="caption" tone="muted">title · hint · icon · action</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'lg',
							wrap: true,
						}}>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									title: 'No transactions yet',
								}}></ui-empty-state>
							</ui-surface>
							<ui-surface .state=${{
								tone: 'subtle',
								padding: 'md',
								radius: 'md',
							}}>
								<ui-empty-state .state=${{
									icon: '⊘',
									title: 'Wallet is empty',
									hint: 'Fund your wallet to get started.',
									actionLabel: 'Open faucet',
								}}></ui-empty-state>
							</ui-surface>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIPanel</ui-text>
						<ui-text variant="caption" tone="muted">id · title · status dot chrome</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'md',
							wrap: true,
						}}>
							<ui-panel .state=${{
								id: 'WALLET',
								title: 'ADDRESS',
							}}></ui-panel>
							<ui-panel .state=${{
								id: 'NET',
								title: 'STATUS',
								showDot: false,
							}}></ui-panel>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIThemeSelect</ui-text>
						<ui-text variant="caption" tone="muted">popover theme switcher</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-theme-select></ui-theme-select>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIModal</ui-text>
						<ui-text variant="caption" tone="muted">native dialog · backdrop dismiss</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Open modal',
							tone: 'primary',
						}} @buttonClick=${this.openModal}></ui-button>
						<ui-modal #modal>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text variant="h3" tone="accent">Confirm transfer</ui-text>
									<ui-text variant="body" tone="muted">This sends 12.4 VIAT to the selected address. This action cannot be undone.</ui-text>
									<ui-stack .state=${{
										direction: 'row',
										gap: 'sm',
										justify: 'end',
									}}>
										<ui-button .state=${{
											label: 'Cancel',
											variant: 'ghost',
										}} @buttonClick=${this.closeModal}></ui-button>
										<ui-button .state=${{
											label: 'Confirm',
											tone: 'primary',
										}} @buttonClick=${this.closeModal}></ui-button>
									</ui-stack>
								</ui-stack>
							</ui-surface>
						</ui-modal>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UIModal · built-in controls</ui-text>
						<ui-text variant="caption" tone="muted">opt-in close / maximize / minimize buttons · controlsSide · afterAction</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'sm',
							wrap: true,
						}}>
							<ui-button .state=${{
								label: 'Windows-style (right)',
								tone: 'primary',
							}} @buttonClick=${this.openControlsModal}></ui-button>
							<ui-button .state=${{
								label: 'macOS-style (left)',
								tone: 'primary',
								variant: 'outline',
							}} @buttonClick=${this.openMacModal}></ui-button>
							<ui-button .state=${{
								label: 'With afterAction callback',
								variant: 'ghost',
							}} @buttonClick=${this.openMaximizedStartModal}></ui-button>
						</ui-stack>
						<ui-modal #controlsModal .state=${{
							showClose: true,
							showMaximize: true,
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text variant="h3" tone="accent">Built-in controls · right</ui-text>
									<ui-text variant="body" tone="muted">Minimize collapses the body to a 240×46 strip; maximize fills the viewport; close dismisses. State resets to default on close.</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
						<ui-modal #macModal .state=${{
							showClose: true,
							showMaximize: true,
							controlsSide: 'left',
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text variant="h3" tone="accent">macOS-style</ui-text>
									<ui-text variant="body" tone="muted">Same buttons, anchored left with close-first ordering done via CSS order (DOM stays unchanged).</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
						<ui-modal #afterActionModal .state=${{
							showClose: true,
							showMaximize: true,
						}}>
							<ui-surface .state=${{
								tone: 'popup',
								padding: 'lg',
								radius: 'lg',
							}}>
								<ui-stack .state=${{
									direction: 'column',
									gap: 'md',
								}}>
									<ui-text variant="h3" tone="accent">afterAction</ui-text>
									<ui-text variant="body" tone="muted">When you close this modal the registered callback fires with the close returnValue. Watch the confirm-behavior section below.</ui-text>
								</ui-stack>
							</ui-surface>
						</ui-modal>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UICloseButton</ui-text>
						<ui-text variant="caption" tone="muted">rotate-on-hover × · same animation used by the built-in modal close</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'md',
							align: 'center',
						}}>
							<ui-close-button></ui-close-button>
							<ui-text variant="caption" tone="muted">hover → rotate(90deg); active → rotate(180deg)</ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UITabs</ui-text>
						<ui-text variant="caption" tone="muted">animated tab strip · cross-fade content swap · vertical & horizontal</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'column',
							gap: 'lg',
						}}>
							<ui-tabs .tabs=${[
								{ id: 'overview', label: 'Overview' },
								{ id: 'security', label: 'Security' },
								{ id: 'advanced', label: 'Advanced' },
							]}>
								<ui-surface slot="overview" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Horizontal tabs · overview panel.</ui-text>
								</ui-surface>
								<ui-surface slot="security" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Security panel content.</ui-text>
								</ui-surface>
								<ui-surface slot="advanced" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Advanced panel content.</ui-text>
								</ui-surface>
							</ui-tabs>
							<ui-tabs .orientation=${'vertical'} .tabs=${[
								{ id: 'profile', label: 'Profile' },
								{ id: 'wallet', label: 'Wallet' },
								{ id: 'theme', label: 'Theme' },
							]}>
								<ui-surface slot="profile" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Vertical tabs · profile panel.</ui-text>
								</ui-surface>
								<ui-surface slot="wallet" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Wallet panel.</ui-text>
								</ui-surface>
								<ui-surface slot="theme" .state=${{
									tone: 'subtle',
									padding: 'md',
									radius: 'md',
								}}>
									<ui-text variant="body">Theme panel.</ui-text>
								</ui-surface>
							</ui-tabs>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">this.confirm()</ui-text>
						<ui-text variant="caption" tone="muted">imperative this.confirm(message) · ui-modal backed · returns Promise&lt;boolean&gt;</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Delete wallet',
								tone: 'danger',
							}} @click=${this.doDestructiveAction}></ui-button>
							<ui-text variant="caption" tone="muted">last result: ${this.state.confirmResult}</ui-text>
						</ui-stack>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UINotification</ui-text>
						<ui-text variant="caption" tone="muted">stacked toasts · default · error</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-stack .state=${{
							direction: 'row',
							gap: 'sm',
							wrap: true,
							align: 'center',
						}}>
							<ui-button .state=${{
								label: 'Push notification',
								tone: 'primary',
							}} @buttonClick=${this.notifyDefault}></ui-button>
							<ui-button .state=${{
								label: 'Push error',
								tone: 'danger',
							}} @buttonClick=${this.notifyError}></ui-button>
						</ui-stack>
						<ui-notification #notify></ui-notification>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">UILoadingScreen</ui-text>
						<ui-text variant="caption" tone="muted">blocking overlay · auto-closes after 2s</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Show loading screen',
							tone: 'primary',
						}} @buttonClick=${this.showLoadingScreen}></ui-button>
						<ui-loading-screen #loading></ui-loading-screen>
					</ui-surface>
				</section>

				<section class="preview-section">
					<div class="preview-section-head">
						<ui-text variant="overline" tone="accent">BootScreen</ui-text>
						<ui-text variant="caption" tone="muted">full-screen splash · auto-dismisses after 2s</ui-text>
					</div>
					<ui-surface .state=${{
						tone: 'panel',
						padding: 'lg',
						radius: 'lg',
						border: true,
					}}>
						<ui-button .state=${{
							label: 'Show boot screen',
							tone: 'primary',
						}} @buttonClick=${this.showBootScreen}></ui-button>
					</ui-surface>
				</section>

			</div>
		`;
	}
}
customElements.define('preview-view', PreviewView);
export default PreviewView;
