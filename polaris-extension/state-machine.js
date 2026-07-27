/**
 * Polaris State Machine
 * 
 * Explicit finite state machine governing learning state transitions.
 * Background Service Worker is the ONLY caller of transition().
 * 
 * States:
 *   NOT_AUTHENTICATED — No token present
 *   IDLE              — Authenticated but no focus session running
 *   FOCUSED_TRACKING  — Focus active + productive site + user active
 *   FOCUSED_PAUSED    — Focus active + non-productive site
 *   FOCUSED_IDLE      — Focus active + productive site + user/content script idle
 * 
 * Events:
 *   AUTH_GAINED       — Token received
 *   AUTH_LOST         — Token expired or removed
 *   FOCUS_STARTED     — Focus session started
 *   FOCUS_STOPPED     — Focus session ended
 *   TAB_CHANGED       — Active tab or URL changed
 *   HEARTBEAT_LOST    — Content script heartbeat timed out
 *   HEARTBEAT_RESUMED — Content script heartbeat restored
 *   USER_IDLE         — User inactive > 30 seconds
 *   USER_ACTIVE       — User activity resumed
 */

const STATES = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  IDLE: 'IDLE',
  FOCUSED_TRACKING: 'FOCUSED_TRACKING',
  FOCUSED_PAUSED: 'FOCUSED_PAUSED',
  FOCUSED_IDLE: 'FOCUSED_IDLE',
};

const EVENTS = {
  AUTH_GAINED: 'AUTH_GAINED',
  AUTH_LOST: 'AUTH_LOST',
  FOCUS_STARTED: 'FOCUS_STARTED',
  FOCUS_STOPPED: 'FOCUS_STOPPED',
  TAB_CHANGED: 'TAB_CHANGED',
  HEARTBEAT_LOST: 'HEARTBEAT_LOST',
  HEARTBEAT_RESUMED: 'HEARTBEAT_RESUMED',
  USER_IDLE: 'USER_IDLE',
  USER_ACTIVE: 'USER_ACTIVE',
};

/**
 * Transition table.
 * Each key is a current state. Each value maps events to the next state.
 * Events not listed for a state are ignored (no transition).
 * 
 * TAB_CHANGED is special: the next state depends on whether the new tab is productive.
 * We use TAB_CHANGED_PRODUCTIVE and TAB_CHANGED_UNPRODUCTIVE internally.
 */
const TRANSITIONS = {
  [STATES.NOT_AUTHENTICATED]: {
    [EVENTS.AUTH_GAINED]: STATES.IDLE,
  },

  [STATES.IDLE]: {
    [EVENTS.AUTH_LOST]: STATES.NOT_AUTHENTICATED,
    FOCUS_STARTED_PRODUCTIVE: STATES.FOCUSED_TRACKING,
    FOCUS_STARTED_UNPRODUCTIVE: STATES.FOCUSED_PAUSED,
  },

  [STATES.FOCUSED_TRACKING]: {
    [EVENTS.AUTH_LOST]: STATES.NOT_AUTHENTICATED,
    [EVENTS.FOCUS_STOPPED]: STATES.IDLE,
    TAB_CHANGED_UNPRODUCTIVE: STATES.FOCUSED_PAUSED,
    [EVENTS.HEARTBEAT_LOST]: STATES.FOCUSED_IDLE,
    [EVENTS.USER_IDLE]: STATES.FOCUSED_IDLE,
  },

  [STATES.FOCUSED_PAUSED]: {
    [EVENTS.AUTH_LOST]: STATES.NOT_AUTHENTICATED,
    [EVENTS.FOCUS_STOPPED]: STATES.IDLE,
    TAB_CHANGED_PRODUCTIVE: STATES.FOCUSED_TRACKING,
  },

  [STATES.FOCUSED_IDLE]: {
    [EVENTS.AUTH_LOST]: STATES.NOT_AUTHENTICATED,
    [EVENTS.FOCUS_STOPPED]: STATES.IDLE,
    [EVENTS.HEARTBEAT_RESUMED]: STATES.FOCUSED_TRACKING,
    [EVENTS.USER_ACTIVE]: STATES.FOCUSED_TRACKING,
    TAB_CHANGED_UNPRODUCTIVE: STATES.FOCUSED_PAUSED,
    TAB_CHANGED_PRODUCTIVE: STATES.FOCUSED_TRACKING,
  },
};

const PolarisStateMachine = {
  /**
   * Compute the next state given the current state and an event.
   * @param {string} currentState - current learning state
   * @param {string} event - the event that occurred
   * @param {Object} [context] - additional context (e.g. { isProductive: true })
   * @returns {{ newState: string, changed: boolean }}
   */
  transition(currentState, event, context = {}) {
    const stateTransitions = TRANSITIONS[currentState];
    if (!stateTransitions) {
      console.warn(`[StateMachine] Unknown state: ${currentState}`);
      return { newState: currentState, changed: false };
    }

    let resolvedEvent = event;

    // Resolve TAB_CHANGED into productive/unproductive variant
    if (event === EVENTS.TAB_CHANGED) {
      resolvedEvent = context.isProductive ? 'TAB_CHANGED_PRODUCTIVE' : 'TAB_CHANGED_UNPRODUCTIVE';
    }

    // Resolve FOCUS_STARTED into productive/unproductive variant
    if (event === EVENTS.FOCUS_STARTED) {
      resolvedEvent = context.isProductive ? 'FOCUS_STARTED_PRODUCTIVE' : 'FOCUS_STARTED_UNPRODUCTIVE';
    }

    const newState = stateTransitions[resolvedEvent];
    if (!newState) {
      // No transition defined for this event in this state — ignore
      return { newState: currentState, changed: false };
    }

    const changed = newState !== currentState;
    if (changed) {
      console.log(`[StateMachine] ${currentState} → ${newState} (event: ${event})`);
    }

    return { newState, changed };
  },

  /**
   * Check if the current state means tracking should be active.
   * @param {string} state
   * @returns {boolean}
   */
  isTracking(state) {
    return state === STATES.FOCUSED_TRACKING;
  },

  /**
   * Check if the current state means a focus session is running (any focused state).
   * @param {string} state
   * @returns {boolean}
   */
  isFocused(state) {
    return state === STATES.FOCUSED_TRACKING ||
           state === STATES.FOCUSED_PAUSED ||
           state === STATES.FOCUSED_IDLE;
  },

  /**
   * Check if the current state means the user is authenticated.
   * @param {string} state
   * @returns {boolean}
   */
  isAuthenticated(state) {
    return state !== STATES.NOT_AUTHENTICATED;
  },

  STATES,
  EVENTS,
};
