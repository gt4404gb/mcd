import {applyMiddleware, compose, createStore} from 'redux';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createSagaMiddleware from 'redux-saga';
import {createLogger} from 'redux-logger';
import rootReducer from '../reducers';

const configureStore = (preloadedState) => {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer,
        preloadedState,
        compose(
            applyMiddleware(thunk, promiseMiddleware, sagaMiddleware, createLogger()),
            window && window.devToolsExtension ? window.devToolsExtension() : (f) => f
        )
    );

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('../reducers', () => {
            store.replaceReducer(rootReducer);
        });
    }
    store.runSaga = sagaMiddleware.run;
    window.__store = store;
    return store;
};

export default configureStore;
