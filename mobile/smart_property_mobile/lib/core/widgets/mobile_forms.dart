import 'package:flutter/material.dart';

import '../network/mobile_api.dart';
import '../theme/app_colors.dart';

String mobileText(dynamic value) =>
    value == null || '$value'.trim().isEmpty ? '-' : '$value';

String mobileError(Object error) => '$error'.replaceFirst('Exception: ', '');

String mobileDate(dynamic value, {bool schedule = false}) {
  final d = DateTime.tryParse('$value');
  if (d == null) return mobileText(value);

  final date = schedule ? d.toUtc() : d.toLocal();
  String two(int n) => '$n'.padLeft(2, '0');

  return '${two(date.day)}/${two(date.month)}/${date.year} '
      '${two(date.hour)}:${two(date.minute)}';
}

class MobileField {
  const MobileField(
    this.key,
    this.label, {
    this.isRequired = false,
    this.kind = 'text',
    this.value,
    this.lines = 1,
  });

  final String key;
  final String label;
  final String kind;
  final bool isRequired;
  final dynamic value;
  final int lines;
}

Future<bool> mobileForm(
  BuildContext context,
  String title,
  List<MobileField> fields,
  Future<void> Function(Json) submit, {
  List<Widget> Function(void Function(VoidCallback))? extra,
  String? Function(Json)? validate,
}) async =>
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => MobileFormScreen(
          title: title,
          fields: fields,
          submit: submit,
          extra: extra,
          validate: validate,
        ),
      ),
    ) ??
    false;

class MobileFormScreen extends StatefulWidget {
  const MobileFormScreen({
    super.key,
    required this.title,
    required this.fields,
    required this.submit,
    this.extra,
    this.validate,
    this.closeOnSuccess = true,
  });

  final String title;
  final bool closeOnSuccess;
  final List<MobileField> fields;
  final Future<void> Function(Json) submit;
  final List<Widget> Function(void Function(VoidCallback))? extra;
  final String? Function(Json)? validate;

  @override
  State<MobileFormScreen> createState() => _MobileFormScreenState();
}

class _MobileFormScreenState extends State<MobileFormScreen> {
  final _form = GlobalKey<FormState>();
  late final Map<String, TextEditingController> _controllers;

  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controllers = {
      for (final f in widget.fields)
        f.key: TextEditingController(text: f.value == null ? '' : '${f.value}'),
    };
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy || !_form.currentState!.validate()) return;

    final Json data = {};

    for (final f in widget.fields) {
      final raw = _controllers[f.key]!.text;
      final value = f.kind == 'password' ? raw : raw.trim();

      data[f.key] = f.kind == 'number'
          ? double.tryParse(value)
          : f.kind == 'integer'
          ? int.tryParse(value)
          : value.isEmpty && !f.isRequired
          ? null
          : value;
    }

    final validationError = widget.validate?.call(data);
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await widget.submit(data);
      if (mounted && widget.closeOnSuccess) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _validate(MobileField f, String? raw) {
    final v = (raw ?? '').trim();

    if (v.isEmpty) {
      return f.isRequired ? '${f.label} is required.' : null;
    }

    if (f.kind == 'email' &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v)) {
      return 'Enter a valid email.';
    }

    if (f.kind == 'mobile' && !RegExp(r'^\d{10}$').hasMatch(v)) {
      return 'Enter exactly 10 digits.';
    }

    if (f.kind == 'password' && (raw ?? '').length < 6) {
      return 'Use at least 6 characters.';
    }

    if (f.kind == 'number' &&
        (double.tryParse(v) == null || !double.parse(v).isFinite)) {
      return 'Enter a valid number.';
    }

    if (f.kind == 'integer' && int.tryParse(v) == null) {
      return 'Enter a whole number.';
    }

    if (f.kind == 'date' &&
        (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(v) ||
            DateTime.tryParse(v) == null)) {
      return 'Use YYYY-MM-DD.';
    }

    if (f.kind == 'url') {
      final u = Uri.tryParse(v);
      if (u == null ||
          !['http', 'https'].contains(u.scheme) ||
          u.host.isEmpty) {
        return 'Enter an http:// or https:// link.';
      }
    }

    return null;
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_busy,
    child: Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(widget.title)),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            for (final f in widget.fields)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: TextFormField(
                  controller: _controllers[f.key],
                  enabled: !_busy,
                  obscureText: f.kind == 'password',
                  maxLines: f.kind == 'password' ? 1 : f.lines,
                  keyboardType: f.kind == 'number' || f.kind == 'integer'
                      ? const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: true,
                        )
                      : f.kind == 'mobile'
                      ? TextInputType.phone
                      : f.kind == 'email'
                      ? TextInputType.emailAddress
                      : TextInputType.text,
                  decoration: InputDecoration(
                    labelText: '${f.label}${f.isRequired ? ' *' : ''}',
                    suffixIcon: f.kind == 'date' && !f.isRequired
                        ? IconButton(
                            onPressed: _busy
                                ? null
                                : () => _controllers[f.key]!.clear(),
                            icon: const Icon(Icons.clear),
                            tooltip: 'Clear date',
                          )
                        : null,
                  ),
                  validator: (v) => _validate(f, v),
                  readOnly: f.kind == 'date',
                  onTap: f.kind != 'date'
                      ? null
                      : () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate:
                                DateTime.tryParse(_controllers[f.key]!.text) ??
                                DateTime.now(),
                            firstDate: DateTime(1900),
                            lastDate: DateTime(2200),
                          );

                          if (picked != null && mounted) {
                            _controllers[f.key]!.text = picked
                                .toIso8601String()
                                .substring(0, 10);
                          }
                        },
                ),
              ),
            if (widget.extra != null)
              AbsorbPointer(
                absorbing: _busy,
                child: Column(
                  children: widget.extra!((fn) {
                    if (mounted) setState(fn);
                  }),
                ),
              ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error),
                ),
              ),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: Text(_busy ? 'Submitting...' : 'Submit'),
            ),
          ],
        ),
      ),
    ),
  );
}

class MobileInfoCard extends StatelessWidget {
  const MobileInfoCard(
    this.title,
    this.values, {
    super.key,
    this.actions = const [],
  });

  final String title;
  final Map<String, dynamic> values;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          for (final entry in values.entries)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text('${entry.key}: ${mobileText(entry.value)}'),
            ),
          if (actions.isNotEmpty)
            Wrap(spacing: 8, runSpacing: 6, children: actions),
        ],
      ),
    ),
  );
}

Future<bool> mobileConfirm(BuildContext context, String message) async =>
    await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Confirm'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Continue'),
          ),
        ],
      ),
    ) ??
    false;
