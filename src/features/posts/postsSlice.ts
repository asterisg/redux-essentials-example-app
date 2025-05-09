import { RootState } from '@/app/store'
import { AppStartListening } from '@/app/listenerMiddleware'
import { createSelector, createEntityAdapter, EntityState } from '@reduxjs/toolkit'
import { client } from '@/api/client'
import { logout } from '../auth/authSlice'
import { createAppSlice } from '@/app/createAppSlice'

import { apiSlice } from '@/features/api/apiSlice'

export interface Reactions {
  thumbsUp: number
  tada: number
  heart: number
  rocket: number
  eyes: number
}

export type ReactionName = keyof Reactions
export interface Post {
  id: string
  title: string
  content: string
  user: string
  date: string
  reactions: Reactions
}

export type PostUpdate = Pick<Post, 'id' | 'title' | 'content'>
export type NewPost = Pick<Post, 'title' | 'content' | 'user'>

const initialReactions: Reactions = {
  thumbsUp: 0,
  tada: 0,
  heart: 0,
  rocket: 0,
  eyes: 0,
}

interface PostsState extends EntityState<Post, string> {
  status: 'idle' | 'pending' | 'succeeded' | 'rejected'
  error: string | null
}

const postsAdapter = createEntityAdapter<Post>({
  // Sort in descending date order
  sortComparer: (a, b) => b.date.localeCompare(a.date),
})

const initialState: PostsState = postsAdapter.getInitialState({
  status: 'idle',
  error: null,
})

// Create the slice and pass in the initial state
const postsSlice = createAppSlice({
  name: 'posts',
  initialState,
  reducers: (create) => {
    return {
      postUpdated: create.reducer<PostUpdate>((state, action) => {
        const { id, title, content } = action.payload
        postsAdapter.updateOne(state, { id, changes: { title, content } })
      }),
      reactionAdded: create.reducer<{ postId: string; reaction: ReactionName }>((state, action) => {
        const { postId, reaction } = action.payload
        const existingPost = state.entities[postId]
        if (existingPost) {
          existingPost.reactions[reaction]++
        }
      }),
      fetchPosts: create.asyncThunk(
        // Payload creator function to fetch the data
        async () => {
          const response = await client.get<Post[]>('/fakeApi/posts')
          return response.data
        },
        {
          // Options for `createAsyncThunk`
          options: {
            condition(arg, thunkApi) {
              const { posts } = thunkApi.getState() as RootState
              if (posts.status !== 'idle') {
                return false
              }
            },
          },
          // The case reducers to handle the dispatched actions.
          // Each of these is optional, but must use these names.
          pending: (state, action) => {
            state.status = 'pending'
          },
          fulfilled: (state, action) => {
            state.status = 'succeeded'
            // Add any fetched posts to the array
            postsAdapter.setAll(state, action.payload)
          },
          rejected: (state, action) => {
            state.status = 'rejected'
            state.error = action.error.message ?? 'Unknown Error'
          },
        },
      ),
      addNewPost: create.asyncThunk(
        async (initialPost: NewPost) => {
          // We send the initial data to the fake API server
          const response = await client.post<Post>('/fakeApi/posts', initialPost)
          // The response includes the complete post object, including unique ID
          return response.data
        },
        {
          fulfilled: postsAdapter.addOne,
        },
      ),
    }
  },
  extraReducers: (builder) => {
    builder.addCase(logout.fulfilled, (state) => {
      // Clear out the list of posts whenever the user logs out
      return initialState
    })
  },
  selectors: {
    // Note that these selectors are given just the `PostsState`
    // as an argument, not the entire `RootState`
    selectPostsStatus: (state) => state.status,
    selectPostsError: (state) => state.error,
  },
})

export const { postUpdated, reactionAdded, fetchPosts, addNewPost } = postsSlice.actions

export const { selectPostsError, selectPostsStatus } = postsSlice.selectors

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors((state: RootState) => state.posts)

export const selectPostsByUser = createSelector(
  [selectAllPosts, (state: RootState, userId: string) => userId],
  (posts, userId) => posts.filter((post) => post.user === userId),
)

export const addPostsListeners = (startAppListening: AppStartListening) => {
  startAppListening({
    matcher: apiSlice.endpoints.addNewPost.matchFulfilled,
    effect: async (action, listenerApi) => {
      const { toast } = await import('react-tiny-toast')

      const toastId = toast.show('New post added!', {
        variant: 'success',
        position: 'bottom-right',
        pause: true,
      })

      await listenerApi.delay(5000)
      toast.remove(toastId)
    },
  })
}

// Export the generated reducer function
export default postsSlice.reducer
