"use client"
import { useEffect, useState } from 'react'
import { useGetPokemonByNameQuery } from './services/pokemon'
import { useGetPokemonsQuery } from './services/pokemons'
import { fetcherBlob } from './utility/fetcher'
import { capitalize } from './utility/text'
import { useGetPokemonSpeciesByNameQuery } from './services/pokemon-species'
import styles from './page.module.scss'


export default function Home() {
  const [choosenPokemon, setChoosenPokemon] = useState("1")
  const Pokemons = useGetPokemonsQuery({ limit: 50, offset: 0 })
  const Pokemon = useGetPokemonByNameQuery(choosenPokemon, { skip: choosenPokemon === "" })
  const PokemonSpecies = useGetPokemonSpeciesByNameQuery(choosenPokemon, { skip: choosenPokemon === "" })
  const [profileImg, setProfileImg] = useState<Blob | null>(null)


  useEffect(() => {
    if (Pokemon.data) {
      fetcherBlob("", Pokemon.data.sprites.other?.home.front_default || Pokemon.data.sprites.front_default).then(data => {
        if (data) setProfileImg(data)
      })
    }
  }, [Pokemon])


  return (
    <main className={styles['pokemon-container']}>

      <div className={styles['pokemon-card']}>
        <h1>Select a Pokemon</h1>
        <select value={choosenPokemon} onChange={(e) => setChoosenPokemon(e.currentTarget.value)}>
          {
            (Pokemons.data && Pokemons.data.results.length > 0) &&
            Pokemons.data.results.map(item => {
              return (
                <option key={item.name} value={item.url.split("/").slice(-2, -1)}>{item.name}</option>
              )
            })
          }
        </select>
        {
          profileImg && <img src={URL.createObjectURL(profileImg)} alt={Pokemon.data?.name} />
        }

        {
          PokemonSpecies.data && (
            <>
              <h2>Short Description</h2>
              <p>{PokemonSpecies.data.flavor_text_entries.find(item => item.language.name === "en")?.flavor_text}</p>
            </>
          )
        }

        <div className={styles["pokemon-action"]}>
          <button onClick={() => {
            setChoosenPokemon(state => +state > 1 ? String(+state - 1) : state)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M11 15L8 12M8 12L11 9M8 12L16 12M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Prev
          </button>
          <button onClick={() => {
            setChoosenPokemon(state => +state < (Pokemons?.data?.results.length || 0) ? String(+state + 1) : state)
          }}>
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M13 9L16 12M16 12L13 15M16 12L8 12M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles["pokemon-detail"]}>
        {Pokemon.data && (
          <>
            <h1>Pokemon Name: {capitalize(Pokemon.data.name)}</h1>
            <h2>Abilities</h2>
            <ul>
              {Pokemon.data.abilities.map((item, index) => {
                return <li key={item.ability.name}>{item.ability.name}{(index < Pokemon.data.abilities.length - 1) && <>{","}&nbsp;</>} </li>
              })}
            </ul>

            <h2>stats</h2>
            <ul>
              {Pokemon.data.stats.map((item, index) => {
                return <li key={item.stat.name}>{item.stat.name}{(index < Pokemon.data.stats.length - 1) && <>{","}&nbsp;</>} </li>
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}
