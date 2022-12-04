import { Command, UpdateMap } from 'use-backlash'
import { ResizeMode, Filter } from '../../domain/types'
import { swap } from '../../utils'
import shallowequal from 'shallowequal'
import { Services } from '../../services/types'

export type Id = `${number}`

export type KeyedFilter = Filter & { id: Id }

type State = {
  selectedResizeMode: ResizeMode
  isAddingFilter: boolean
  filters: readonly KeyedFilter[]
  nextId: number
  image: { static: number } | { uri: string }
}

type Actions = {
  selectResizeMode: [resizeMode: ResizeMode]
  startAddFilter: []
  confirmAddFilter: [filter: Filter]
  cancelAddFilter: []
  removeFilter: [id: Id]
  updateFilter: [id: Id, filter: Filter]
  moveFilterUp: [id: Id]
  moveFilterDown: [id: Id]
  takePhoto: []
  photoTaken: [image: { uri: string }]
}

type Injects = {
  takePhoto: Services['ImagePicker']['takePhoto']
}

export const init = (staticImage: number): Command<State, Actions, Injects> => [
  {
    selectedResizeMode: 'center',
    isAddingFilter: false,
    filters: [],
    nextId: 0,
    image: { static: staticImage }
  }
]

export const update: UpdateMap<State, Actions, Injects> = {
  selectResizeMode: (state, selectedResizeMode) =>
    selectedResizeMode === state.selectedResizeMode ? [state] : [{ ...state, selectedResizeMode }],

  startAddFilter: (state) => [{ ...state, isAddingFilter: true }],

  confirmAddFilter: ({ filters, nextId, ...state }, filter) => [
    {
      ...state,
      filters: [...filters, { ...filter, id: `${nextId}` }],
      nextId: nextId + 1,
      isAddingFilter: false
    }
  ],

  cancelAddFilter: (state) => [{ ...state, isAddingFilter: false }],

  removeFilter: (state, id) => {
    const { filters } = state

    return filters.find((f) => f.id === id) === undefined
      ? [state]
      : [{ ...state, filters: filters.filter((f) => f.id !== id) }]
  },

  moveFilterDown: (state, id) => {
    const { filters } = state
    const index = filters.findIndex((f) => f.id === id)
    const nextFilters = swap(filters, index, index + 1)

    return nextFilters === filters ? [state] : [{ ...state, filters: nextFilters }]
  },

  moveFilterUp: (state, id) => {
    const { filters } = state
    const index = filters.findIndex((f) => f.id === id)
    const nextFilters = swap(filters, index - 1, index)

    return nextFilters === filters ? [state] : [{ ...state, filters: nextFilters }]
  },

  updateFilter: (state, id, filter) => {
    const { filters } = state
    const index = filters.findIndex((f) => f.id === id)
    const nextFilter = { ...filter, id }

    if (shallowequal(filters[index], nextFilter)) {
      return [state]
    }

    const nextFilters = [...filters]
    nextFilters[index] = nextFilter

    return [{ ...state, filters: nextFilters }]
  },

  takePhoto: (state) => [
    state,
    async ({ photoTaken }, { takePhoto }) => {
      const photo = await takePhoto()
      if (photo !== 'canceled') {
        photoTaken(photo)
      }
    }
  ],

  photoTaken: (state, image) => [{ ...state, image }]
}