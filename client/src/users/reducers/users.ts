import { Action, Reducer, Store } from '@ngrx/store';
import { List, Map, Record, fromJS } from 'immutable';
import { normalize, arrayOf } from 'normalizr';

import { IUser, IUsers, userSchema, UserRecord } from '../models/users';

import {
    LOADING_USERS,
    LOADED_USERS,
    LOADING_USER,
    LOADED_USER,
    ADDING_USER,
    ADDED_USER,
    DELETING_USER,
    DELETED_USER,
    PATCHED_USER
} from '../models/users';

var initialState:IUsers = fromJS({
    result: [],
    entities: {
        users: {}
    },
    adding: false,
    loading: false
});
// note the reducer name will be used as the state property name to store state relative to the reducer
// so state.users.entities or state.users.loading
export const users:Reducer<any> = (state = initialState, action:Action) => {
    switch (action.type) {
        case LOADING_USERS:
        case LOADING_USER:
            return state.set('loading', true);

        case LOADED_USERS:
            const normalizedUsers:IUsers = normalize(action.payload, arrayOf(userSchema));
            console.log(12, 'payload', action.payload);
            console.log(12, 'normalised payload', normalizedUsers);
            // You should use withMutations when you want to group several changes on an object.
            return state.withMutations(map => {
                map.set('loading', false);
                map.set('result', List(normalizedUsers.result));
                normalizedUsers.result.forEach((userId:number) => {
                    map.setIn(
                        ['entities', 'users', userId],
                        new UserRecord(normalizedUsers.entities.users[userId])
                    );
                });
            });

        case LOADED_USER:
            // You should use withMutations when you want to group several changes on an object.
            return state.withMutations(map => {
                map.set('loading', false);
                if (map.get('result').indexOf(action.payload.id) === -1) {
                    map.update('result', list => list.push(action.payload.id));
                }
                map.setIn(
                    ['entities', 'users', action.payload.id],
                    new UserRecord(action.payload)
                );
            });

        case DELETING_USER:
            return state.setIn(['entities', 'users', action.payload.id, 'deleting'], true);

        case DELETED_USER:
            return state.withMutations(map => map
                .deleteIn(['entities', 'users', action.payload])
                .deleteIn(['result', map.get('result').indexOf(action.payload)])
            );
        case ADDING_USER:
            return state.set('adding', true);

        case ADDED_USER:
            return state.withMutations(map => map
                .setIn(['entities', 'users', action.payload.id], new UserRecord(action.payload))
                .update('result', list => list.push(action.payload.id))
                .set('adding', false)
            );

        case PATCHED_USER:
            return state
                .setIn(['entities', 'users', action.payload.id], new UserRecord(action.payload));

        default:
            return state;
    }
};
