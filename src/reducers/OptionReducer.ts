import { Reducer } from "react";
import { Action, ActionGenerator } from "./RootReducer";

export interface OptionState {
    uiScale: number;
    keywords: string[];
}

const storageOptions = localStorage.getItem('options');

const defaultState: OptionState = storageOptions ? JSON.parse(storageOptions) : {
    uiScale: 1,
    keywords: []
}

export const ACTION_CHANGE_UISCALE = "Options/CHANGE_UISCALE";
export const getUIScaleChangeAction: ActionGenerator<number> = value => ({ 
    type: ACTION_CHANGE_UISCALE, value
});

export const ACTION_CHANGE_KEYWORD = "Options/CHANGE_KEYWORD";
export const getKeywordChangeAction: ActionGenerator<{ idx: number, keyword: string }> = value => ({ 
    type: ACTION_CHANGE_KEYWORD, value
});

export const ACTION_REMOVE_KEYWORD = "Options/REMOVE_KEYWORD";
export const getKeywordRemoveAction: ActionGenerator<number> = value => ({ 
    type: ACTION_REMOVE_KEYWORD, value
});

export const ACTION_ADD_KEYWORD = "Options/ADD_KEYWORD";
export const getKeywordAddAction: ActionGenerator<string> = value => ({ 
    type: ACTION_ADD_KEYWORD, value
});

const optionReducer: Reducer<OptionState, Action<any>> = (state = defaultState, action) => {
    let changeState = state;
    switch(action.type) {
        case ACTION_CHANGE_UISCALE:
            changeState = { ...state, uiScale: action.value };
            break;
        case ACTION_CHANGE_KEYWORD: {
            let keywords = [ ...state.keywords ];
            keywords[action.value.idx] = action.value.keyword;
            changeState = { ...state, keywords };
            break;
        }
        case ACTION_ADD_KEYWORD:
            changeState = { ...state, keywords: [ ...state.keywords, action.value ] };
            break;
        case ACTION_REMOVE_KEYWORD: {
            let keywords = [ ...state.keywords ];
            keywords.splice(action.value, 1);
            changeState = { ...state, keywords };
            break;
        }
    }
    
    localStorage.setItem('options', JSON.stringify(changeState));

    return changeState;
}
export default optionReducer;