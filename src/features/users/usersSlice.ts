import type { RootState } from '@/app/store'
import { createEntityAdapter, createSelector } from '@reduxjs/toolkit'
import { selectCurrentUsername } from '@/features/auth/authSlice'

import { apiSlice } from '@/features/api/apiSlice'

export interface User {
  id: string
  name: string
}

const usersAdapter = createEntityAdapter<User>()

const emptyUsers: User[] = []

// Calling `someEndpoint.select(someArg)` generates a new selector that will return
// the query result object for a query with those parameters.
// To generate a selector for a specific query argument, call `select(theQueryArg)`.
// In this case, the users query has no params, so we don't pass anything to select()
export const selectUsersResult = apiSlice.endpoints.getUsers.select()

export const selectAllUsers = createSelector(selectUsersResult, (usersResult) => usersResult?.data ?? emptyUsers)

export const selectUserById = createSelector(
  selectAllUsers,
  (state: RootState, userId: string) => userId,
  (users, userId) => users.find((user) => user.id === userId),
)

export const selectCurrentUser = (state: RootState) => {
  const currentUsername = selectCurrentUsername(state)
  if (currentUsername) {
    return selectUserById(state, currentUsername)
  }
}

// export const { selectAll: selectAllUsers, selectById: selectUserById } = usersAdapter.getSelectors(
//   (state: RootState) => state.users,
// )

// export const selectCurrentUser = (state: RootState) => {
//   const currentUsername = selectCurrentUsername(state)
//   if (!currentUsername) {
//     return
//   }
//   return selectUserById(state, currentUsername)
// }
