/**
 * VotRite Keyboard Accessibility Mode
 * Activated via F3 key. Provides full keyboard-only voting for visually impaired users.
 *
 * Key mapping (home-row anchored on F/J bumps):
 *   F     - Confirm / Select current candidate
 *   J     - Next page
 *   D     - Back one page
 *   K     - Deselect current candidate
 *   S     - Read current selection aloud
 *   L     - Read instructions / help aloud
 *   Space - Activate focused button (standard)
 *   Esc   - Cancel ballot / close dialog
 *   Up/Down arrows - Move focus between candidates/options
 *   F3    - Toggle accessibility mode / read help
 */

var VotRiteA11y = (function () {
    var enabled = false;
    var focusIndex = -1;
    var focusableItems = [];
    var synth = window.speechSynthesis;
    var currentUtterance = null;

    function speak(text, interrupt) {
        if (!synth) return;
        if (interrupt !== false) {
            synth.cancel();
        }
        var utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        utter.lang = 'en-US';
        currentUtterance = utter;
        synth.speak(utter);
    }

    function stopSpeaking() {
        if (synth) synth.cancel();
    }

    function showA11yBanner() {
        if (document.getElementById('a11y-banner')) return;
        var banner = document.createElement('div');
        banner.id = 'a11y-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;' +
            'background:#1a237e;color:#fff;text-align:center;padding:8px 16px;font-size:16px;' +
            'font-weight:bold;letter-spacing:1px;';
        banner.textContent = 'KEYBOARD MODE ACTIVE — F=Select  J=Next  D=Back  K=Deselect  S=Read Selections  L=Help  F3=Off';
        document.body.insertBefore(banner, document.body.firstChild);
        // Show keyboard instruction panels
        var instrPanels = document.querySelectorAll('.a11y-instructions');
        for (var i = 0; i < instrPanels.length; i++) {
            instrPanels[i].style.display = 'block';
        }
    }

    function hideA11yBanner() {
        var banner = document.getElementById('a11y-banner');
        if (banner) banner.remove();
        // Hide keyboard instruction panels
        var instrPanels = document.querySelectorAll('.a11y-instructions');
        for (var i = 0; i < instrPanels.length; i++) {
            instrPanels[i].style.display = 'none';
        }
    }

    function createFocusStyle() {
        if (document.getElementById('a11y-focus-style')) return;
        var style = document.createElement('style');
        style.id = 'a11y-focus-style';
        style.textContent =
            '.a11y-focused { outline: 4px solid #FFD600 !important; outline-offset: 4px !important; ' +
            'box-shadow: 0 0 0 6px rgba(255,214,0,0.4) !important; position: relative; z-index: 10; }' +
            '.a11y-mode .md-checkbox label, .a11y-mode .md-radio label { font-size: 20px !important; }' +
            '.a11y-mode .guide-desc-body h4 { font-size: 18px !important; line-height: 1.5 !important; }';
        document.head.appendChild(style);
    }

    function removeFocusStyle() {
        var style = document.getElementById('a11y-focus-style');
        if (style) style.remove();
    }

    function collectFocusables() {
        focusableItems = [];
        // Checkboxes (candidate selection, propositions)
        var checks = document.querySelectorAll('input.md-check, input.md-radiobtn');
        for (var i = 0; i < checks.length; i++) {
            focusableItems.push({ type: 'input', el: checks[i] });
        }
        // Spinner +/- buttons (ranked choice)
        var spinners = document.querySelectorAll('.spinner');
        for (var i = 0; i < spinners.length; i++) {
            focusableItems.push({ type: 'spinner', el: spinners[i] });
        }
        // Write-in input
        var writeIn = document.getElementById('form_control_1');
        if (writeIn) {
            focusableItems.push({ type: 'writein', el: writeIn });
        }
    }

    function clearFocus() {
        var prev = document.querySelector('.a11y-focused');
        if (prev) prev.classList.remove('a11y-focused');
    }

    function setFocus(index) {
        if (focusableItems.length === 0) return;
        if (index < 0) index = focusableItems.length - 1;
        if (index >= focusableItems.length) index = 0;
        focusIndex = index;
        clearFocus();
        var item = focusableItems[focusIndex];
        var target;
        if (item.type === 'input') {
            target = item.el.closest('.md-checkbox') || item.el.closest('.md-radio') || item.el.parentElement;
        } else if (item.type === 'spinner') {
            target = item.el;
        } else {
            target = item.el;
        }
        if (target) {
            target.classList.add('a11y-focused');
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        announceFocusedItem();
    }

    function announceFocusedItem() {
        if (focusIndex < 0 || focusIndex >= focusableItems.length) return;
        var item = focusableItems[focusIndex];
        var text = '';
        if (item.type === 'input') {
            var label = item.el.closest('.md-checkbox, .md-radio');
            if (label) {
                text = label.textContent.trim();
            }
            if (item.el.type === 'checkbox' && item.el.checked) {
                text += '. Currently selected.';
            } else if (item.el.type === 'radio' && item.el.checked) {
                text += '. Currently selected.';
            } else {
                text += '. Not selected.';
            }
        } else if (item.type === 'spinner') {
            var labelEl = item.el.closest('.form-group.row');
            var nameEl = labelEl ? labelEl.querySelector('.control-label') : null;
            var valEl = item.el.querySelector('.spinner-input');
            text = (nameEl ? nameEl.textContent.trim() : 'Candidate') +
                   '. Current value: ' + (valEl ? valEl.value : '0') + '.';
        } else if (item.type === 'writein') {
            text = 'Write-in candidate text field. ' +
                   (item.el.value ? 'Current text: ' + item.el.value : 'Empty.');
        }
        speak(text);
    }

    function selectCurrent() {
        if (focusIndex < 0 || focusIndex >= focusableItems.length) {
            speak('No item focused. Use up and down arrows to navigate.');
            return;
        }
        var item = focusableItems[focusIndex];
        if (item.type === 'input') {
            if (item.el.type === 'checkbox') {
                item.el.click();
                var isChecked = item.el.checked;
                speak(item.el.closest('.md-checkbox, .md-radio').textContent.trim() +
                      (isChecked ? '. Selected.' : '. Deselected.'));
            } else if (item.el.type === 'radio') {
                item.el.click();
                speak(item.el.closest('.md-radio').textContent.trim() + '. Selected.');
            }
            $(item.el).trigger('change');
        } else if (item.type === 'spinner') {
            var upBtn = item.el.querySelector('.spinner-up');
            if (upBtn) {
                $(upBtn).trigger('click');
                var valEl = item.el.querySelector('.spinner-input');
                speak('Increased to ' + (valEl ? valEl.value : ''));
            }
        } else if (item.type === 'writein') {
            item.el.focus();
            speak('Write-in field active. Type candidate name, then press F to add.');
        }
    }

    function deselectCurrent() {
        if (focusIndex < 0 || focusIndex >= focusableItems.length) {
            speak('No item focused.');
            return;
        }
        var item = focusableItems[focusIndex];
        if (item.type === 'input' && item.el.type === 'checkbox' && item.el.checked) {
            item.el.click();
            $(item.el).trigger('change');
            speak(item.el.closest('.md-checkbox').textContent.trim() + '. Deselected.');
        } else if (item.type === 'spinner') {
            var downBtn = item.el.querySelector('.spinner-down');
            if (downBtn) {
                $(downBtn).trigger('click');
                var valEl = item.el.querySelector('.spinner-input');
                speak('Decreased to ' + (valEl ? valEl.value : ''));
            }
        } else {
            speak('Nothing to deselect.');
        }
    }

    function clickNext() {
        var btn = document.querySelector('.btn-voter');
        if (btn) {
            speak('Moving to next page.');
            setTimeout(function () { $(btn).trigger('click'); }, 500);
        } else {
            speak('No next button available on this page.');
        }
    }

    function clickBack() {
        var btn = document.querySelector('.btn-voter-back') ||
                  document.querySelector('.btn-back') ||
                  document.querySelector('.btn-review');
        if (btn) {
            speak('Going back.');
            setTimeout(function () { $(btn).trigger('click'); }, 500);
        } else {
            speak('No back button available on this page.');
        }
    }

    function cancelBallot() {
        var cancel = document.querySelector('.btn-voter-back');
        if (cancel && cancel.textContent.trim() === 'Cancel Ballot') {
            speak('Cancelling ballot. Returning to ballot selection.');
            setTimeout(function () { $(cancel).trigger('click'); }, 500);
            return;
        }
        // Close any open modal
        var modal = document.querySelector('.modal.in, .modal.show');
        if (modal) {
            $(modal).modal('hide');
            speak('Dialog closed.');
            return;
        }
        speak('Press Escape again on the review page to cancel your ballot.');
    }

    function readSelection() {
        var selections = [];
        var checked = document.querySelectorAll('input.md-check:checked');
        for (var i = 0; i < checked.length; i++) {
            var container = checked[i].closest('.md-checkbox, .md-radio');
            if (container) selections.push(container.textContent.trim());
        }
        var radios = document.querySelectorAll('input.md-radiobtn:checked');
        for (var i = 0; i < radios.length; i++) {
            var container = radios[i].closest('.md-radio');
            if (container) selections.push(container.textContent.trim());
        }
        // Spinner values
        var spinnerInputs = document.querySelectorAll('.spinner-input');
        for (var i = 0; i < spinnerInputs.length; i++) {
            if (parseInt(spinnerInputs[i].value) > 0) {
                var row = spinnerInputs[i].closest('.form-group.row');
                var label = row ? row.querySelector('.control-label') : null;
                selections.push((label ? label.textContent.trim() : 'Candidate') +
                               ': ' + spinnerInputs[i].value);
            }
        }
        if (selections.length === 0) {
            speak('No selections made yet.');
        } else {
            speak('Your current selections are: ' + selections.join('. '));
        }
    }

    function getPageType() {
        var url = window.location.pathname;
        if (url.indexOf('/client/ballot') !== -1) return 'ballot';
        if (url.indexOf('/client/lang') !== -1 || url.indexOf('/client/viewcand') !== -1) return 'language';
        if (url.indexOf('/client/race') !== -1 || url.indexOf('/client/viewcand') !== -1) return 'race';
        if (url.indexOf('/client/prop') !== -1) return 'proposition';
        if (url.indexOf('/client/mass') !== -1) return 'mass_proposition';
        if (url.indexOf('/client/review') !== -1) return 'review';
        if (url.indexOf('/client/cast') !== -1) return 'cast';
        if (url.indexOf('/client') !== -1) return 'login';
        return 'unknown';
    }

    function readInstructions() {
        var pageType = getPageType();

        var helpText = 'VotRite Keyboard Help. ';

        helpText += 'Navigation keys, anchored on the home row bumps on F and J. ';
        helpText += 'Up Arrow: Move to the previous item. ';
        helpText += 'Down Arrow: Move to the next item. ';
        helpText += 'F key: Select or confirm the highlighted item. ';
        helpText += 'K key: Deselect or decrease the highlighted item. ';
        helpText += 'J key: Proceed to the next page. ';
        helpText += 'D key: Go back to the previous page. ';
        helpText += 'S key: Read all your current selections aloud. ';
        helpText += 'L key: Repeat these instructions. ';
        helpText += 'Spacebar: Activate the currently focused button. ';
        helpText += 'Escape key: Cancel your ballot, or close a dialog. ';
        helpText += 'F3 key: Turn accessibility mode on or off. ';

        // Page-specific help
        if (pageType === 'ballot') {
            helpText += 'You are on the ballot selection page. Use Up and Down arrows to choose a ballot. Press F to select it. Press J to proceed.';
        } else if (pageType === 'language') {
            helpText += 'You are on the language selection page. Use Up and Down arrows to choose a language. Press F to select it. Press J to proceed.';
        } else if (pageType === 'login') {
            helpText += 'You are on the login page. Tab to the pincode field, type your pincode, then Tab to the Login button and press Enter or Spacebar.';
        } else if (pageType === 'race') {
            var hasSpinners = document.querySelectorAll('.spinner').length > 0;
            if (hasSpinners) {
                helpText += 'You are on a ranked choice race page. Use Up and Down arrows to move between candidates. Press F to increase a candidate value. Press K to decrease it. Press J when done to go to the next race. Press D to go back.';
            } else {
                helpText += 'You are on a candidate selection page. Use Up and Down arrows to move between candidates. Press F to select a candidate. A check mark will confirm your choice. Press K to deselect. Press J when done to go to the next race. Press D to go back.';
            }
            var maxVotes = document.getElementById('maxvotes');
            if (maxVotes) {
                helpText += ' You have ' + maxVotes.textContent + ' choices remaining.';
            }
        } else if (pageType === 'proposition' || pageType === 'mass_proposition') {
            helpText += 'You are on a proposition page. Use Up and Down arrows to move between Yes, No, For, or Against options. Press F to select your answer. Press K to deselect. Press J to proceed to the next item. Press D to go back.';
        } else if (pageType === 'review') {
            helpText += 'You are on the review page. Press S to hear all your selections read aloud. Press J to cast your vote. Press D to go back and make changes. Press Escape to cancel your ballot entirely.';
        } else if (pageType === 'cast') {
            helpText += 'Your vote has been cast successfully. You will be redirected shortly.';
        }

        speak(helpText);
    }

    function announcePageLoad() {
        if (!enabled) return;
        var pageType = getPageType();
        var title = '';

        var voterTitle = document.querySelector('.voter-title h2');
        if (voterTitle) {
            title = voterTitle.textContent.trim();
        }
        var subtitle = document.querySelector('.voter-title h4');
        if (subtitle) {
            title += '. ' + subtitle.textContent.trim();
        }

        // Page-specific announcements
        if (pageType === 'ballot') {
            title += '. Choose a ballot using Up and Down arrows, then press F to select and J to proceed.';
        } else if (pageType === 'language') {
            title += '. Choose a language using Up and Down arrows, then press F to select and J to proceed.';
        } else if (pageType === 'login') {
            title = 'VotRite Login. Tab to the pincode field and enter your code. Then Tab to Login and press Enter.';
        } else if (pageType === 'race') {
            var guideHeader = document.querySelector('.guide-desc-header h2');
            if (guideHeader) {
                title += '. ' + guideHeader.textContent.trim();
            }
            var maxVotes = document.getElementById('maxvotes');
            if (maxVotes) {
                title += '. You have ' + maxVotes.textContent + ' choices remaining.';
            }
            var hasSpinners = document.querySelectorAll('.spinner').length > 0;
            if (hasSpinners) {
                title += ' Use Up and Down arrows to navigate candidates. F to increase, K to decrease. J for next, D to go back.';
            } else {
                title += ' Use Up and Down arrows to navigate candidates. F to select, K to deselect. J for next, D to go back.';
            }
        } else if (pageType === 'proposition' || pageType === 'mass_proposition') {
            title += '. Use Up and Down arrows to navigate options. F to select, K to deselect. J for next, D to go back.';
        } else if (pageType === 'review') {
            title += '. Review your choices. Press S to hear all selections. J to cast your vote. D to go back. Escape to cancel.';
        } else if (pageType === 'cast') {
            title = 'Your vote has been successfully cast. Thank you for voting.';
        }

        // Progress counter
        var progress = document.querySelector('.page-footer-voter h4');
        if (progress && pageType !== 'review' && pageType !== 'cast') {
            title += ' ' + progress.textContent.trim() + '.';
        }

        if (!title) title = 'VotRite page loaded. Press L for help.';

        title += ' Press L for full instructions.';
        speak(title);
    }

    function enable() {
        enabled = true;
        document.body.classList.add('a11y-mode');
        createFocusStyle();
        showA11yBanner();
        collectFocusables();
        focusIndex = -1;
        speak('Keyboard accessibility mode is now on. ' +
              'Your hands should rest on the home row. The F and J keys have raised bumps you can feel. ' +
              'F selects a candidate. J goes to the next page. D goes back. K deselects. ' +
              'Up and Down arrows move between candidates. ' +
              'S reads your selections. L reads full help. ' +
              'Press F3 at any time to turn this mode off.');
        // Auto-announce page after help finishes
        setTimeout(function () {
            if (enabled) announcePageLoad();
        }, 8000);
    }

    function disable() {
        enabled = false;
        document.body.classList.remove('a11y-mode');
        clearFocus();
        removeFocusStyle();
        hideA11yBanner();
        stopSpeaking();
        focusIndex = -1;
    }

    function toggle() {
        if (enabled) {
            disable();
            speak('Accessibility mode off.');
        } else {
            enable();
        }
    }

    function handleKeyDown(e) {
        // F3 always works to toggle
        if (e.key === 'F3' || e.keyCode === 114) {
            e.preventDefault();
            toggle();
            return;
        }

        if (!enabled) return;

        // Don't intercept if typing in a text input (write-in field)
        var tag = e.target.tagName;
        var isTyping = (tag === 'INPUT' && e.target.type === 'text') || tag === 'TEXTAREA';

        // Allow Escape and F3 even when typing
        if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            if (isTyping) {
                e.target.blur();
                speak('Exited text field.');
            } else {
                cancelBallot();
            }
            return;
        }

        // If typing in write-in, let normal keys through except our shortcuts
        if (isTyping) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Trigger write-in button
                var writeInBtn = document.querySelector('.btn-voter-else');
                if (writeInBtn) {
                    $(writeInBtn).trigger('click');
                    speak('Write-in candidate added: ' + e.target.value);
                    e.target.value = '';
                }
            }
            return;
        }

        switch (e.key) {
            case 'ArrowUp':
            case 'Up':
                e.preventDefault();
                if (focusableItems.length === 0) collectFocusables();
                setFocus(focusIndex - 1);
                break;

            case 'ArrowDown':
            case 'Down':
                e.preventDefault();
                if (focusableItems.length === 0) collectFocusables();
                setFocus(focusIndex + 1);
                break;

            case 'f':
                e.preventDefault();
                selectCurrent();
                break;

            case 'j':
                e.preventDefault();
                clickNext();
                break;

            case 'd':
                e.preventDefault();
                clickBack();
                break;

            case 'k':
                e.preventDefault();
                deselectCurrent();
                break;

            case 's':
                e.preventDefault();
                readSelection();
                break;

            case 'l':
                e.preventDefault();
                readInstructions();
                break;

            case ' ':
                // Let space work naturally on focused buttons
                break;
        }
    }

    // Check if mode was enabled before page navigation (persisted in sessionStorage)
    function checkPersistence() {
        if (sessionStorage.getItem('votrite_a11y') === 'on') {
            enable();
        }
    }

    function init() {
        document.addEventListener('keydown', handleKeyDown, true);
        checkPersistence();

        // Persist mode state across page loads
        var origEnable = enable;
        enable = function () {
            origEnable();
            sessionStorage.setItem('votrite_a11y', 'on');
        };
        var origDisable = disable;
        disable = function () {
            origDisable();
            sessionStorage.setItem('votrite_a11y', 'off');
        };
    }

    return {
        init: init,
        toggle: toggle,
        isEnabled: function () { return enabled; }
    };
})();

jQuery(document).ready(function () {
    VotRiteA11y.init();
});
