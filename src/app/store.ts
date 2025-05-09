import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit'

import authReudcer from '@/features/auth/authSlice'
import postReducer from '@/features/posts/postsSlice'
import userReducer from '@/features/users/usersSlice'

export const store = configureStore({
  reducer: {
    auth: authReudcer,
    posts: postReducer,
    users: userReducer,
  },
})

// Infer the type of `store`
export type AppStore = typeof store
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch
// Same for the `RootState` type
export type RootState = ReturnType<typeof store.getState>
// Export a reusable type for handwritten thunks
export type AppThunk = ThunkAction<void, RootState, unknown, Action>
