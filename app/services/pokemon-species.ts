import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { PokemonSpecies } from '../types/PokemonSpecies'


export const pokemonSpeciesApi = createApi({
  reducerPath: 'pokemonSpeciesApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getPokemonSpeciesByName: builder.query<PokemonSpecies, string>({
      query: (name) => `pokemon-species/${name}`,
    }),
  }),
})


export const { useGetPokemonSpeciesByNameQuery } = pokemonSpeciesApi