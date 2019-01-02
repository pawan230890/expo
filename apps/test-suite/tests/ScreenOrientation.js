'use strict';

import { ScreenOrientation } from 'expo';
import { Platform } from 'react-native';

export const name = 'ScreenOrientation';

const convertToCoarseOrientation = orientation => {
  if (
    orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
    orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
  ) {
    return ScreenOrientation.Orientation.PORTRAIT;
  } else if (
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
  ) {
    return ScreenOrientation.Orientation.LANDSCAPE;
  } else {
    return orientation;
  }
};

// Wait until we are in desiredOrientation
// Fail if we are not in a validOrientation
const applyAsync = ({ desiredOrientationLock, desiredOrientations, validOrientations }) => {
  if (Platform.OS === 'ios' && desiredOrientations) {
    // ios can only detect orientation of coarse granularity (ie) 'PORTRAIT'/'LANDSCAPE'
    desiredOrientations = desiredOrientations.map(orientation =>
      convertToCoarseOrientation(orientation)
    );
  }
  if (Platform.OS === 'ios' && validOrientations) {
    // ios can only detect orientation of coarse granularity (ie) 'PORTRAIT'/'LANDSCAPE'
    validOrientations = validOrientations.map(orientation =>
      convertToCoarseOrientation(orientation)
    );
  }
  return new Promise(async function(resolve, reject) {
    let subscriptionCancelled = false;
    const subscription = await ScreenOrientation.addOrientationChangeListenerAsync(async update => {
      console.log(`GOT UPDATE: ${JSON.stringify(update)}`);
      const { orientationInfo, orientationLock } = update;
      const { orientation } = orientationInfo;
      if (validOrientations && !validOrientations.includes(orientation)) {
        reject(new Error(`Should not have received an orientation of ${orientation}`));
      }

      if (desiredOrientations && !desiredOrientations.includes(orientation)) {
        return;
      } else if (desiredOrientationLock && orientationLock !== desiredOrientationLock) {
        return;
      }

      // We have met all the desired orientation conditions
      // remove itself
      if (!subscriptionCancelled && subscription) {
        console.log(`LISTENER SUB WAS ${subscription}`);
        await ScreenOrientation.removeOrientationChangeListenerAsync(subscription);
        subscriptionCancelled = true;
      }

      // resolve promise
      resolve();
    });

    if (desiredOrientationLock) {
      // set the screen orientation to desired orientation lock
      await ScreenOrientation.lockAsync(desiredOrientationLock);
    }

    const orientationInfo = await ScreenOrientation.getOrientationAsync();
    const { orientation } = orientationInfo;
    const orientationLock = await ScreenOrientation.getOrientationLockAsync();

    if (desiredOrientations && !desiredOrientations.includes(orientation)) {
      return;
    } else if (desiredOrientationLock && orientationLock !== desiredOrientationLock) {
      return;
    }

    // We have met all the desired orientation conditions
    // remove previous subscription
    if (!subscriptionCancelled) {
      console.log(`CHECK SUB WAS ${subscription}`);
      await ScreenOrientation.removeOrientationChangeListenerAsync(subscription);
      subscriptionCancelled = true;
    }
    resolve();
  });
};

export function test(t) {
  t.describe('Screen Orientation', () => {
    t.describe('Screen Orientation locking, getters, setters, listeners, etc', () => {
      t.beforeEach(async () => {
        // Put the screen back to PORTRAIT_UP
        const desiredOrientation = ScreenOrientation.Orientation.PORTRAIT_UP;

        await applyAsync({
          desiredOrientationLock: ScreenOrientation.OrientationLock.PORTRAIT_UP,
          desiredOrientations: [desiredOrientation],
        });
      });
      t.afterEach(async () => {
        await ScreenOrientation.removeOrientationChangeListenersAsync();
      });
      /*       t.it(
        'Sets screen to landscape orientation and gets the correct orientationLock',
        async () => {
          try {
            // set the screen orientation to LANDSCAPE LEFT lock
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

            // detect the correct orientationLock policy immediately
            const orientationLock = await ScreenOrientation.getOrientationLockAsync();
            t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
          } catch (error) {
            t.fail(error);
          }
        }
      );

      t.it('Sets screen to landscape orientation and gets the correct orientation', async () => {
        try {
          const desiredOrientationLock = ScreenOrientation.OrientationLock.LANDSCAPE_LEFT;
          const desiredOrientation = ScreenOrientation.Orientation.LANDSCAPE_LEFT;
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await applyAsync({
            desiredOrientationLock,
            desiredOrientations: [desiredOrientation],
            validOrientations,
          });

          const orientationInfo = await ScreenOrientation.getOrientationAsync();
          const { orientation } = orientationInfo;
          // ios can only detect orientation with coarse granularity
          t.expect([
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.LANDSCAPE,
          ]).toContain(orientation);
        } catch (error) {
          t.fail(error);
        }
      });

      // We rely on RN to emit `didUpdateDimensions`
      // If this method no longer works, it's possible that the underlying RN implementation has changed
      // see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
      t.it(
        'Register for the callback, set to landscape orientation and get the correct orientation',
        async () => {
          try {
            const callListenerAsync = new Promise(async function(resolve, reject) {
              // Register for screen orientation changes
              await ScreenOrientation.addOrientationChangeListenerAsync(async update => {
                const { orientationInfo } = update;
                const { orientation } = orientationInfo;
                if (
                  orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
                  orientation === ScreenOrientation.Orientation.PORTRAIT // ios can only detect orientation with coarse granularity
                ) {
                  // orientation update has not happened yet
                } else if (
                  orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                  orientation === ScreenOrientation.Orientation.LANDSCAPE // ios can only detect orientation with coarse granularity
                ) {
                  resolve();
                } else {
                  reject(new Error(`Should not be in orientation: ${orientation}`));
                }
              });

              // Put the screen to LANDSCAPE_LEFT
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
            });

            // Wait for listener to get called
            await callListenerAsync;
          } catch (error) {
            t.fail(error);
          }
        }
      );

      t.it('Unlock the screen orientation back to default', async () => {
        try {
          // Put the screen to LANDSCAPE_LEFT
          await applyAsync({
            desiredOrientationLock: ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
            desiredOrientations: [ScreenOrientation.Orientation.LANDSCAPE_LEFT],
          });

          // Unlock the screen orientation
          await ScreenOrientation.unlockAsync();

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.DEFAULT);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Apply a native android lock', async () => {
        // This test only applies to android devices
        if (Platform.OS !== 'android') {
          return;
        }

        try {
          // Apply the native USER_LANDSCAPE android lock (11)
          // https://developer.android.com/reference/android/R.attr#screenOrientation
          await ScreenOrientation.lockPlatformAsync({ screenOrientationConstantAndroid: 11 });

          // detect the correct orientationLock policy immediately
          const orientationLock = await ScreenOrientation.getOrientationLockAsync();
          t.expect(orientationLock).toBe(ScreenOrientation.OrientationLock.OTHER);

          // expect the native platform getter to return correctly
          const nativeOrientationLock = await ScreenOrientation.getPlatformOrientationLockAsync();
          t.expect(nativeOrientationLock).toBe('11');

          // expect there to be some lag for orientation update to take place
          // poll until we receive a LANDSCAPE orientation from the callback
          const desiredOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
          ];
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
            ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await applyAsync({ desiredOrientations, validOrientations });
        } catch (error) {
          t.fail(error);
        }
      }); */

      t.it('Remove all listeners and expect them never to be called', async () => {
        try {
          // Register for screen orientation changes
          let listenerWasCalled = false;
          await ScreenOrientation.addOrientationChangeListenerAsync(async () => {
            listenerWasCalled = true;
          });

          await ScreenOrientation.addOrientationChangeListenerAsync(async () => {
            listenerWasCalled = true;
          });

          await ScreenOrientation.removeOrientationChangeListenersAsync();

          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // If we set a different lock and wait for it to be applied without ever having the
          // listeners invoked, we assume they've been successfully removed
          const desiredOrientations = [ScreenOrientation.Orientation.LANDSCAPE_LEFT];
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await applyAsync({ desiredOrientations, validOrientations });

          // expect listeners to not have been called
          t.expect(listenerWasCalled).toBe(false);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('Register some listeners and remove a subset', async () => {
        try {
          // Register for screen orientation changes
          let subscription1Called = false;
          let subscription2Called = false;

          const subscription1 = await ScreenOrientation.addOrientationChangeListenerAsync(
            async () => {
              subscription1Called = true;
            }
          );

          await ScreenOrientation.addOrientationChangeListenerAsync(async () => {
            subscription2Called = true;
          });

          // remove subscription1 ONLY
          console.log(`REGISTER TEST SUB WAS ${subscription1}`);
          await ScreenOrientation.removeOrientationChangeListenerAsync(subscription1);

          // set the screen orientation to LANDSCAPE LEFT lock
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);

          // If we set a different lock and wait for it to be applied without ever having the
          // listeners invoked, we assume they've been successfully removed
          const desiredOrientations = [ScreenOrientation.Orientation.LANDSCAPE_LEFT];
          const validOrientations = [
            ScreenOrientation.Orientation.LANDSCAPE_LEFT,
            ScreenOrientation.Orientation.PORTRAIT_UP,
          ];
          await applyAsync({ desiredOrientations, validOrientations });

          // expect subscription1 to NOT have been called
          t.expect(subscription1Called).toBe(false);

          // expect subscription2 to have been called
          t.expect(subscription2Called).toBe(true);
        } catch (error) {
          t.fail(error);
        }
      });

      t.it('ensure that we correctly detect our supported orientationLocks', async () => {
        // orientation locks that we should be able to apply
        const acceptedLocks = [
          ScreenOrientation.OrientationLock.ALL,
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
        ];

        for (let lock of acceptedLocks) {
          const supported = await ScreenOrientation.supportsOrientationLockAsync(lock);
          t.expect(supported).toBe(true);
        }

        // This is not a lock policy that we can apply
        const unsupportedLock = ScreenOrientation.OrientationLock.OTHER;
        const supported = await ScreenOrientation.supportsOrientationLockAsync(unsupportedLock);
        t.expect(supported).toBe(false);

        // Expect non-lock values to throw an error
        const notLocks = ['FOO', ScreenOrientation.Orientation.UNKNOWN, 3];
        for (let notLock of notLocks) {
          let hasError = false;
          try {
            await ScreenOrientation.supportsOrientationLockAsync(notLock);
          } catch (e) {
            hasError = true;
          }
          t.expect(hasError).toBe(true);
        }
      });
    });
  });
}
