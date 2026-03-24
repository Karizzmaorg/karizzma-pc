//! Native Windows trackpad pinch-to-zoom support.
//!
//! With `zoomHotkeysEnabled: true`, WebView2 processes trackpad pinch gestures and changes
//! its page zoom factor. We intercept that change via ZoomFactorChanged, reset the native
//! zoom back to 1.0 (so the whole page doesn't distort), and emit the zoom ratio to the
//! frontend so the reader can apply it to just the content.

use std::sync::OnceLock;
use tauri::{Emitter, Manager};
use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings5;
use windows_core::Interface;

static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

pub fn setup_pinch_zoom(app: &tauri::App) {
    let _ = APP_HANDLE.set(app.handle().clone());

    let main_window = app.get_webview_window("main").unwrap();
    let _ = main_window.with_webview(move |webview| unsafe {
        let controller = webview.controller();

        // Disable Ctrl+/- keyboard zoom (we handle it ourselves in JS)
        // but keep pinch zoom enabled (controlled by zoomHotkeysEnabled in conf)
        let core = controller.CoreWebView2().unwrap();
        let settings = core.Settings().unwrap();
        // Re-enable pinch specifically (wry ties both to the same flag)
        if let Ok(settings5) = settings.cast::<ICoreWebView2Settings5>() {
            let _ = settings5.SetIsPinchZoomEnabled(true);
        }

        // Intercept zoom factor changes from trackpad pinch.
        // Reset to 1.0 so the whole page doesn't zoom, and emit the factor to JS.
        let ctrl_clone = controller.clone();
        let handler = webview2_com::ZoomFactorChangedEventHandler::create(Box::new(
            move |_controller, _args| {
                let mut factor: f64 = 1.0;
                let _ = ctrl_clone.ZoomFactor(&mut factor);
                if (factor - 1.0).abs() > 0.001 {
                    let _ = ctrl_clone.SetZoomFactor(1.0);
                    if let Some(handle) = APP_HANDLE.get() {
                        let _ = handle.emit("pinch-zoom", factor);
                    }
                }
                Ok(())
            },
        ));
        let mut token: i64 = 0;
        let _ = controller.add_ZoomFactorChanged(&handler, &mut token);
    });
}
