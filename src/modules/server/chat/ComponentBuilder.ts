import { CSSProperties } from "react";
import { BlockTextComponent, ButtonComponent, DisplayType, EmbedTextComponent, HiddenComponent, ImageComponent, MessageComponent, ProgressComponent, TextComponent } from "../../../types";
import { Utils } from "../../util/Utils";

export function isMessageComponent(obj: any): obj is MessageComponent {
    return typeof obj === 'object' && obj !== null && 'children' in obj;
}

export function isTextComponent(obj: any): obj is TextComponent {
    return isMessageComponent(obj) && 'content' in obj && 
        typeof obj['content'] === 'string' &&
        'style' in obj;
}

export function isBlockTextComponent(obj: any): obj is TextComponent {
    return isTextComponent(obj) &&
        'block' in obj && obj['block'] === true;
}
export function isImageComponent(obj: any): obj is ImageComponent {
    return isMessageComponent(obj) &&
        'imageSource' in obj &&
        typeof obj['imageSource'] === 'string' &&
        'width' in obj &&
        typeof obj['width'] === 'number' &&
        'height' in obj &&
        typeof obj['height'] === 'number';
}

export function getRawText(message: MessageComponent) {
    let str = isTextComponent(message) ? message.content : '';
    for(let child of message.children) {
        str += getRawText(child);
    }
    return str;
}

export function isEmbedTextComponent(obj: any): obj is EmbedTextComponent {
    return isMessageComponent(obj) && 
        'embedColor' in obj &&
        typeof obj['embedColor'] === 'string';
}

export function isButtonComponent(obj: any): obj is ButtonComponent {
    return isMessageComponent(obj) && 
        'command' in obj &&
        typeof obj['command'] === 'string';
}

export function isHiddenComponent(obj: any): obj is HiddenComponent {
    return isMessageComponent(obj) && 
        'hidden' in obj && obj['hidden'] === true;
}

export function isProgressComponent(obj: any): obj is ProgressComponent {
    return isMessageComponent(obj) && 
        'progressColor' in obj && typeof obj['progressColor'] === 'string' &&
        'width' in obj && typeof obj['width'] === 'string' &&
        'height' in obj && typeof obj['height'] === 'string' &&
        'progress' in obj && typeof obj['progress'] === 'number';
}

export function includesHiddenComponent(obj: MessageComponent): boolean {
    if(isHiddenComponent(obj)) return true;
    else return (obj['children'] ?? []).some(child => includesHiddenComponent(child));
} 

export class ComponentBuilder {

    static message(children: MessageComponent[]): MessageComponent {
        return {
            children
        };
    }

    static image(src: string, width: number, height: number): ImageComponent {
        return {
            children: [],
            imageSource: src,
            width, height
        };
    }

    static texts(children: (string | MessageComponent)[]) {
        return ComponentBuilder.message(children.map(e => {
            if(typeof e === 'string') return ComponentBuilder.text(e);
            else return e;
        }))
    }

    static empty() {
        return ComponentBuilder.message([]);
    }

    static join(children: MessageComponent[], separator: TextComponent): MessageComponent {
        return ComponentBuilder.message(children.map((child, i, arr) => {
            if(i < arr.length - 1) return [
                child,
                separator
            ];
            return child;
        }).flat());
    }

    static newLine() {
        return ComponentBuilder.text('\n');
    }

    static text(content: string, style?: CSSProperties, children?: MessageComponent[]): TextComponent {
        return {
            children: children ?? [],
            style: style ?? {},
            content
        };
    }

    static blockText(content: string, style?: CSSProperties, children?: MessageComponent[]): BlockTextComponent {
        return { 
            ...ComponentBuilder.text(content, style, children), 
            block: true 
        };
    }

    static hidden(children: MessageComponent[]): HiddenComponent {
        return {
            children,
            hidden: true
        };
    }

    static embed(children: MessageComponent[], embedColor = Utils.MAIN_COLOR): EmbedTextComponent {
        return {
            children,
            embedColor
        };
    }

    static button(children: MessageComponent[], command = ''): ButtonComponent {
        return {
            children,
            command
        };
    }

    static progress(progress: number, color = 'white',
        width = '50px', height = '1em'): ProgressComponent {
        return {
            progress,
            progressColor: color,
            width,
            height,
            children: []
        };
    }

    /**
     * @param width 70px : normal / 150px : long / 40px : short 
     */
    static progressBar(value: number, maxValue: number, displayType: DisplayType, 
        color = 'white', width = '70px', height = '1em'): MessageComponent {

        if(maxValue <= 0) maxValue = 1;
        value = Utils.clamp(value, 0, maxValue);

        const comp =  ComponentBuilder.message([
            ComponentBuilder.progress(value / maxValue, color, width, height)
        ]);
        
        let suffix = '';
        switch(displayType) {
            case 'percent': suffix = '  (' + (value / maxValue * 100).toFixed(0) + '%)'; break;
            case 'float-percent': suffix = '  (' + (value / maxValue * 100).toFixed(2) + '%)'; break;
            case 'int-value': suffix = '  (' + value.toFixed(0) + '/' + maxValue.toFixed(0) + ')'; break;
            case 'float-value':suffix = '  (' + value.toFixed(2) + '/' + maxValue.toFixed(2) + ')'; break;
        }

        comp.children.push(ComponentBuilder.text(suffix, { color: 'lightgray' }));
        return comp;
    }
}