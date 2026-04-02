import type { RootState } from '../../app/providers/store'

export const selectVisibleFaces = (state: RootState) => state.activeClusterDetail?.faces ?? []

export const selectPreviewFace = (state: RootState) =>
  state.activeClusterDetail?.faces.find((face) => face.id === state.previewFaceId) ?? null
