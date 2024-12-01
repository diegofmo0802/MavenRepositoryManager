import { Element, Component, Utilities, Events } from "../../WebApp/WebApp.js";
import { loading } from "../../app.js";
import TextInput from "../basic.components/TextInput.js";
import SelectInput from "../basic.components/SelectInput.js";
import LiveImageInput from "../basic.components/LiveImageInput.js";
import MultiTagInput from "../basic.components/MultiTagInput.js";
import SwitchInput from "../basic.components/SwitchInput.js";
import FileInput from "../basic.components/FileInput.js";
import Api from "../../Api/Api.js";

export class NewVersionForm extends Component<'div', NewVersionForm.eventMap> {
    protected component: Element<"div">;
    protected groupID: TextInput;
    protected artifactID: TextInput;
    protected version: TextInput;
    protected jarFile: FileInput;
    protected withPom: SwitchInput;
    protected pomFile: FileInput;
    protected compilerTarget: SelectInput;
    protected compilerSource: SelectInput;
    protected withSource: SwitchInput;
    protected sourceFile: FileInput;
    protected withJavadoc: SwitchInput;
    protected javadocFile: FileInput;
    protected formFields: Element<'div'>;
    protected pomFields: Element<'div'>;
    protected sourceFields: Element<'div'>;
    protected javadocFields: Element<'div'>;
    protected error: Element<'p'>;
    protected submitButton: Element<'button'>;
    public constructor() { super();
        this.groupID = new TextInput({ name: 'groupID', placeholder: 'groupID', validator: this.validateGroupID.bind(this) });
        this.artifactID = new TextInput({ name: 'artifactID', placeholder: 'artifactID', validator: this.validateArtifactID.bind(this) });
        this.version = new TextInput({ name: 'place', placeholder: 'version', validator: this.validateVersion.bind(this) });

        this.withPom = new SwitchInput(false, 'with pom');
        this.withSource = new SwitchInput(false, 'with source');
        this.withJavadoc = new SwitchInput(false, 'with javadoc');

        this.jarFile = new FileInput({ label: 'jar file' });
        this.pomFile = new FileInput({ label: 'pom file' });
        this.sourceFile = new FileInput({ label: 'source file' });
        this.javadocFile = new FileInput({ label: 'javadoc file' });

        this.compilerSource = new SelectInput(['17', '18', '19', '20', '21'], 'compiler source');
        this.compilerTarget = new SelectInput(['17', '18', '19', '20', '21'], 'compiler target');

        this.error = Element.structure({ type: 'p', attribs: { class: 'Form-error' } });
        this.submitButton = Element.structure({ type: 'button', text: 'publish', attribs: { class: 'Button Login-button' } });
        
        this.pomFields = Element.new('div').setAttribute('class', 'Form-fields').append(
            this.withPom, this.compilerSource, this.compilerTarget
        );
        this.sourceFields = Element.new('div').setAttribute('class', 'Form-fields').append(
            this.withSource
        );
        this.javadocFields = Element.new('div').setAttribute('class', 'Form-fields').append(
            this.withJavadoc
        );
        this.formFields = Element.new('div').setAttribute('class', 'Form-fields').append(
            this.groupID, this.artifactID, this.version,
            this.jarFile,
            this.pomFields, this.sourceFields, this.javadocFields
        );

        this.component = Element.structure({ type: 'div', attribs: { class: 'Form', id: 'upload-form' }, childs: [
            { type: 'div', attribs: { class: 'Form-title' }, text: 'New Post' },
            this.formFields, this.error, this.submitButton
        ] });

        this.groupID.on('input', Utilities.debounce(this.validateGroupID.bind(this), 500));
        this.artifactID.on('input', Utilities.debounce(this.validateArtifactID.bind(this), 500));
        this.version.on('input', Utilities.debounce(this.validateVersion.bind(this), 500));

        this.withPom.on('change', (state) => {
            if (state) {
                this.compilerSource.remove();
                this.compilerTarget.remove();
                this.pomFields.append(this.pomFile);
            } else {
                this.pomFile.remove();
                this.pomFields.append(
                    this.compilerSource,
                    this.compilerTarget
                );
            }
        });

        this.withSource.on('change', (state) => {
            if (state) this.sourceFields.append(this.sourceFile);
            else this.sourceFile.remove();
        });

        this.withJavadoc.on('change', (state) => {
            if (state) this.javadocFields.append(this.javadocFile);
            else this.javadocFile.remove();
        });

        this.submitButton.on('click', (event) => {
            event.preventDefault();
            this.submit();
        });
    }
    protected getFormData(): NewVersionForm.data {
        return {
            artifactID: this.artifactID.getText(),
            groupID: this.groupID.getText(),
            version: this.version.getText(),
            compilerSource: this.compilerSource.getSelected(),
            compilerTarget: this.compilerTarget.getSelected(),
            jarFile: this.jarFile.getFile(0),
            pomFile: this.pomFile.getFile(0),
            sourceFile: this.sourceFile.getFile(0)
        };
    }
    protected validateGroupID(): boolean {
        const groupID = this.groupID.getText();
        if (groupID === '') {groupID
            this.error.text('groupID is required');
            return false;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(groupID)) {
            this.error.text('invalid groupID')
            return false;
        }
        return true;
    }
    protected validateArtifactID(): boolean {
        const artifactID = this.artifactID.getText();
        if (artifactID === '') {
            this.error.text('artifactID is required');
            return false;
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(artifactID)) {
            this.error.text('invalid artifactID')
            return false;
        }
        return true;
    }
    protected validateVersion(): boolean {
        const version = this.version.getText();
        if (version === '') {
            this.error.text('version is required');
            return false;
        }
        if (!/^\d+(\.\d+)*$/.test(version)) {
            this.error.text('invalid version')
            return false;
        }
        return true;
    }
    protected validateForm(): boolean {
        return this.validateGroupID() && this.validateArtifactID();
    }

    protected async submit(): Promise<boolean> {
        if (!this.validateForm()) return false;
        this.submitButton.HTMLElement.disabled = true;
        this.error.text('');
        const {
            groupID, artifactID, version, compilerSource, compilerTarget,
            jarFile, sourceFile, pomFile
        } = this.getFormData();
        loading.spawn(this.component);
        try {
            const post = await Api.Repo.upload({
                groupID, artifactID, version, compiler: {
                    source: compilerSource, target: compilerTarget
                }
            }, { jar: jarFile as File, source: sourceFile as File, pom: pomFile as File });
            this.dispatch('success');
            return true;
        } catch(error) {
            if (error instanceof Error) this.error.text(error.message);
            else this.error.text(`${error}`);
            return false;
        } finally {
            loading.finish();
            this.submitButton.HTMLElement.disabled = false;
        }
    }
}

export namespace NewVersionForm {
    export type Listener = () => void;
    export type eventMap = {
        success: Listener;
    }
    export interface data {
        artifactID: string;
        groupID: string;
        version: string;
        compilerSource: string;
        compilerTarget: string;
        jarFile: File | null;
        pomFile: File | null;
        sourceFile: File | null;
    }
}

export default NewVersionForm;