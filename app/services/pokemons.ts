import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Pokemons } from '../types/Pokemons'


export const pokemonsApi = createApi({
  reducerPath: 'pokemonsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getPokemons: builder.query<Pokemons, {offset: number, limit: number}>({
      query: ({offset, limit}) => `pokemon?offset=${offset}&limit=${limit}`,
    }),
  }),
})


export const { useGetPokemonsQuery } = pokemonsApi