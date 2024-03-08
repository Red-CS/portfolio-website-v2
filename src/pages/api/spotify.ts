import type { SpotifyAccessToken, SpotifyResponse, SpotifyData, SpotifyDataFulfilled } from '@types'
import type { APIRoute } from 'astro'

// Refresh token, defined on ther server
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN
const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
let accessToken: string | undefined

export const GET: APIRoute = async () => {
  // Request access token if null
  accessToken = accessToken ?? (await fetchAccessToken()).access_token

  // Fetch data
  const data = await fetchSpotifyData(accessToken!)

  // Set headers
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  // Craft response
  return new Response(JSON.stringify({ access_token: accessToken ?? '', ...data }), {
    headers: { 'Content-Type': 'application/json' },
    status: setStatusCode(data)
  })
}

/**
 * Queries the Spotify Web API to get the currently playing track.
 * @param accessToken - The access token required to access the Spotify Web API.
 * @returns A Promise to an object containing data obtained from Spotify.
 */
const fetchSpotifyData = async (
  accessToken: SpotifyAccessToken['access_token']
): Promise<SpotifyResponse> => {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: 'Bearer ' + accessToken }
    })

    // TODO - See what response I get when I try to do a 404,
    // I'd like to know how to format the error response for best practice and clarity
    if (!res.ok) {
      // Handle possible access token expiration
      if (res.status === 401) {
        console.error('Access token expired. Fetching a new one . . .')
        accessToken = (await fetchAccessToken()).access_token
        return {
          message: 'Access token expired, fetched a new one'
        }
      }
      console.error(await res.json())
      return {
        message: 'Unexpected error requesting data from Spotify, status code ' + res.status
      }
    }

    // I should only get 200 and 204:
    // https://developer.spotify.com/documentation/web-api/concepts/api-calls
    if (res.status == 204) {
      return null
    }

    if (res.status == 200) {
      const data: SpotifyData = await res.json()

      // Handle possibility of `data.item` being null, as explained in the docs
      if (data.item === null) return { message: 'Spotify `item` object is null.' }

      // Handle possibility of the currently played object not being a track (like an ad or an episode)
      if (data.currently_playing_type !== 'track')
        return {
          message: 'Currently playing ' + data.currently_playing_type + ' instead of a track.'
        }

      return {
        // Object of track's album name and link
        album: {
          name: data.item.album.name,
          href: `https://open.spotify.com/album/${data.item.album.id}`
        },
        // Array of artists for the track
        artists: data.item.artists.map((artist) => {
          return {
            name: artist.name,
            href: `https://open.spotify.com/artist/${artist.id}`
          }
        }),
        // Track name and link
        track: {
          name: data.item.name,
          href: `https://open.spotify.com/track/${data.item.id}`
        }
      }
    }
    // ^^^ Only works when content is playing (status code 200 most likely, i didn't check)
    // Else, it returns an empty body with status code 204
    return { error: 'Unexpected error with status code ' + res.status }
  } catch (e) {
    console.log(e)
    if (!(e instanceof SyntaxError)) return { error: (e as Error).message }
    return { error: 'Syntax error, most likely used .json() on a poor object. ' + e.message }
  }
}

/**
 * Acquires and Access Token from Spotify to access the Spotify API.
 * The Acess token has an expiry time of 1 hour (3600 seconds).
 * This function uses a refresh token along standard client credentials
 * to make the secure request.
 * @returns A Promise to an object containing an access token for the Spotify API
 */
const fetchAccessToken = async (): Promise<SpotifyAccessToken> => {
  try {
    // Send the authorization request
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken!,
        client_id: clientId!,
        scope: 'user-read-currently-playing'
      })
    })

    if (!res.ok) {
      console.error('Network response was not ok.')
      return { access_token: '' }
    }

    const data: SpotifyAccessToken = await res.json()
    accessToken = data.access_token // TODO - Move to KV store
    return { access_token: data.access_token }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
    return { access_token: '' }
  }
}

const setStatusCode = (data: SpotifyResponse) => {
  if (data === null || isSDF(data)) return 200
  return 400
}

function isSDF(obj: SpotifyResponse): obj is SpotifyDataFulfilled {
  return 'album' in obj! && 'artists' in obj! && 'track' in obj!
}
