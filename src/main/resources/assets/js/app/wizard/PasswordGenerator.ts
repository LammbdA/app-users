import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {customAlphabet} from 'nanoid';
import {InputEl} from '@enonic/lib-admin-ui/dom/InputEl';
import {passwordStrength} from 'check-password-strength';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export enum PasswordStrength {
    STRONG = 'strong',
    MEDIUM = 'medium',
    WEAK = 'weak',
    BAD = 'bad'
}

export class PasswordGenerator
    extends FormInputEl {

    private input: InputEl;
    private showLink: AEl;
    private generateLink: AEl;
    private passwordStrength: PasswordStrength;
    private helpTextBlock: DivEl;

    private focusListeners: ((event: FocusEvent) => void)[] = [];
    private blurListeners: ((event: FocusEvent) => void)[] = [];

    constructor() {
        super('div', 'password-generator');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.input = new InputEl('password-input');
        this.showLink = new AEl('show-link');
        this.toggleShowLink(true);
        this.generateLink = new AEl('generate-link');
        this.generateLink.setHtml(i18n('field.generate'));
        this.helpTextBlock = new DivEl('help-text-block');
        this.helpTextBlock.setHtml(i18n('field.pswGenerator.helpText'));
    }

    private initListeners(): void {
        this.initFocusEvents(this.input);

        this.input.onInput(() => {
            this.assessComplexity(this.input.getValue());
            this.notifyValidityChanged(this.input.isValid());
        });

        this.initFocusEvents(this.showLink);

        this.showLink.onClicked((event: MouseEvent) => {
            this.toggleUnlocked(!this.hasClass('unlocked'));

            event.stopPropagation();
            event.preventDefault();
            return false;
        });

        this.initFocusEvents(this.generateLink);

        this.generateLink.onClicked((event: MouseEvent) => {
            this.generatePassword();
            this.assessComplexity(this.input.getValue());
            this.notifyValidityChanged(this.input.isValid());
            event.stopPropagation();
            event.preventDefault();
            return false;
        });
    }

    private toggleUnlocked(unlocked: boolean): void {
        this.toggleClass('unlocked', unlocked);
        this.toggleShowLink(!unlocked);
        this.input.setType(unlocked ? 'text' : 'password');
    }

    setValue(value: string, silent?: boolean, userInput?: boolean): PasswordGenerator {
        return this.doSetValue(value, silent, userInput);
    }

    doGetValue(): string {
        return this.input.getValue();
    }

    doSetValue(value: string, silent?: boolean, userInput?: boolean): PasswordGenerator {
        this.input.setValue(value, silent, userInput);
        this.assessComplexity(value);
        return this;
    }

    getName(): string {
        return this.input.getName();
    }

    setName(value: string): PasswordGenerator {
        this.input.setName(value);
        return this;
    }

    private toggleShowLink(locked: boolean) {
        this.showLink.getEl().setAttribute('data-i18n', i18n(`field.${locked ? 'show' : 'hide'}`));
    }

    reset(): void {
        this.setValue('');
        this.toggleUnlocked(false);
    }

    private assessComplexity(value: string) {
        if (this.passwordStrength) {
            this.removeClass(this.passwordStrength);
            this.passwordStrength = null;
        }

        if (StringHelper.isEmpty(value)) {
            this.getEl().removeAttribute('data-i18n');
            return;
        }

        const testResult: string = passwordStrength(value).value;

        this.passwordStrength = this.getPasswordStrength(testResult);

        this.getEl().setAttribute('data-i18n', i18n(`field.pswGenerator.complexity.${this.passwordStrength}`));
        this.addClass(this.passwordStrength);
    }

    private getPasswordStrength(testResult: string): PasswordStrength {
        return PasswordStrength[testResult.toUpperCase()] || PasswordStrength.BAD;
    }

    private generatePassword() {
        let passStrength = PasswordStrength.BAD;
        let password = ''
        const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+,-.<=>?@[]^_{|}~', 15);
        while (!this.isPasswordValid(passStrength)) {
            password = nanoid();
            passStrength = this.getPasswordStrength(passwordStrength(password).value);
        }
        this.input.setValue(password);
    }

    isValid(): boolean {
        return !!this.getValue() && this.getValue().length > 0 && this.input.isValid() && this.isPasswordValid(this.passwordStrength);
    }

    setFocus(): void {
        this.input.getEl().focus();
    }

    private isPasswordValid(passwordStrength: PasswordStrength): boolean {
        return passwordStrength === PasswordStrength.STRONG || passwordStrength === PasswordStrength.MEDIUM;
    }

    private initFocusEvents(el: Element) {
        el.onFocus((event: FocusEvent) => {
            this.notifyFocused(event);
        });

        el.onBlur((event: FocusEvent) => {
            this.notifyBlurred(event);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const inputWrapper = new DivEl('input-wrapper');
            this.appendChild(inputWrapper);
            inputWrapper.appendChild(this.input);

            const toolbarWrapper = new DivEl('toolbar-wrapper');
            toolbarWrapper.appendChildren(this.showLink, this.generateLink);
            this.appendChild(toolbarWrapper);
            this.appendChild(this.helpTextBlock);

            return rendered;
        });
    }

    onInput(listener: (event: Event) => void): void {
        this.input.onInput(listener);
    }

    unInput(listener: (event: Event) => void): void {
        this.input.unInput(listener);
    }

    onFocus(listener: (event: FocusEvent) => void): void {
        this.focusListeners.push(listener);
    }

    unFocus(listener: (event: FocusEvent) => void): void {
        this.focusListeners = this.focusListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onBlur(listener: (event: FocusEvent) => void): void {
        this.blurListeners.push(listener);
    }

    unBlur(listener: (event: FocusEvent) => void): void {
        this.blurListeners = this.blurListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }

}
