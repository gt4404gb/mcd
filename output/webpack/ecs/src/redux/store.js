import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import createSagaMiddleware from 'redux-saga';
import { createLogger } from 'redux-logger';
import rootReducer from './reducers';
import rootSaga from './saga';

const store = (preloadedState) => {
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
    module.hot.accept('./reducers', () => {
      store.replaceReducer(rootReducer);
    });
  }
  sagaMiddleware.run(rootSaga)

  window.__store = store;
  return store;
};
export default store;
