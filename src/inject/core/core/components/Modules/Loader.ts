import { Injectify } from '../../../definitions/core'
import * as Core from '../../../definitions/module'
import { CurrentScope } from '../../../definitions/module/CurrentScope'
declare const injectify: typeof Injectify
import ErrorGuard from '../../lib/ErrorGuard'

/// #if DEBUG
import * as time from 'pretty-ms'
import * as prettyBytes from 'pretty-bytes'
import { byteLength } from 'byte-length'
/// #endif

export default class {
  constructor(data: Core.ServerResponse) {
    const call = injectify.global.modules.calls[data.token]

    // Create the module object
    var Module = {
      name: data.name,
      token: data.token,
      params: call.params,
      time: data.time || null,
      resolve: (data?: any) => {
        Module.resolved = true
        if (call) {
          call.resolve(data)
        } else {
          /// #if DEBUG
          injectify.debugLog(
            'module',
            'error',
            `Failed to find injectify.global.modules.calls[${
              Module.token
            }], could not resolve Promise`
          )
          /// #endif
        }
      },
      reject: (data?: any) => {
        Module.resolved = true
        if (call) {
          call.reject(data)
        } else {
          /// #if DEBUG
          injectify.debugLog(
            'module',
            'error',
            `Failed to find injectify.global.modules.calls[${
              Module.token
            }], could not reject Promise`
          )
          /// #endif
        }
      },
      resolved: false,
      setState: (newState) => {
        injectify.setState({
          modules: {
            ...injectify.global.modules,
            states: {
              ...injectify.global.modules.states,
              [data.name]: newState
            }
          }
        })
      },
      get state() {
        return injectify.global.modules.states[data.name]
      }
    } as typeof Core.Module

    var __CurrentScope__ = {
      injectify,
      Module
    } as CurrentScope

    if (!data.error) {
      /**
       * Evaluate the script
       */
      ErrorGuard(() => {
        eval(data.script)
      })

      /**
       * Display verbose output
       */
      /// #if DEBUG
      injectify.debugLog(
        'module',
        'warn',
        `Executed module "${Module.name}" - ${prettyBytes(
          byteLength(data.script)
        )} ${Module.time ? `- ${time(Module.time)} ` : ''}`,
        Module
      )
      /// #endif
    } else {
      if (data.error.message) {
        /// #if DEBUG
        console.error(`📦 ${data.error.message}`, Module)
        /// #endif
        injectify.error(`📦 ${data.error.message}`, Module)
      }
      Module.reject(data.error.message)
    }
  }
}
