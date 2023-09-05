import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { pokemonApi } from './services/pokemon'
import { pokemonsApi } from './services/pokemons'
import { pokemonSpeciesApi } from './services/pokemon-species'


export const store = configureStore({
  reducer: {
    [pokemonApi.reducerPath]: pokemonApi.reducer,
    [pokemonSpeciesApi.reducerPath]: pokemonSpeciesApi.reducer,
    [pokemonsApi.reducerPath]: pokemonsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      pokemonApi.middleware,
      pokemonSpeciesApi.middleware,
      pokemonsApi.middleware,
    ),
})


setupListeners(store.dispatch)