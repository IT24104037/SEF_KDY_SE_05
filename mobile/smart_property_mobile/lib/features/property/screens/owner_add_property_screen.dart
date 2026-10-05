import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../services/property_service.dart';

class OwnerAddPropertyScreen extends StatefulWidget {
  const OwnerAddPropertyScreen({super.key});

  @override
  State<OwnerAddPropertyScreen> createState() => _OwnerAddPropertyScreenState();
}

class _OwnerAddPropertyScreenState extends State<OwnerAddPropertyScreen> {
  final PropertyService _service = PropertyService.instance;

  final _formKey = GlobalKey<FormState>();

  final _name = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _description = TextEditingController();
  final _latitude = TextEditingController();
  final _longitude = TextEditingController();
  final _documentType = TextEditingController();
  final _documentUrl = TextEditingController();

  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _city.dispose();
    _description.dispose();
    _latitude.dispose();
    _longitude.dispose();
    _documentType.dispose();
    _documentUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await _service.createProperty(
        name: _name.text,
        address: _address.text,
        city: _city.text,
        description: _description.text,
        latitude: double.tryParse(_latitude.text.trim()),
        longitude: double.tryParse(_longitude.text.trim()),
        documentType: _documentType.text,
        documentUrl: _documentUrl.text,
      );

      if (!mounted) return;

      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Add Property'),
        backgroundColor: AppColors.surface,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                _requiredField(_name, 'Property Name'),
                _requiredField(_address, 'Address'),
                _field(_city, 'City'),
                _field(_description, 'Description', lines: 4),
                _field(_latitude, 'Latitude', number: true),
                _field(_longitude, 'Longitude', number: true),
                _requiredField(_documentType, 'Verification Document Type'),
                _requiredField(_documentUrl, 'Verification Document URL'),

                if (_error != null) ...[
                  const SizedBox(height: 6),
                  Text(_error!, style: const TextStyle(color: AppColors.error)),
                ],

                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.ownerAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                    ),
                    child: Text(_saving ? 'Adding...' : 'Add Property'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _requiredField(TextEditingController controller, String label) {
    return _field(controller, label, required: true);
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    bool number = false,
    int lines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        maxLines: lines,
        keyboardType: number
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.text,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (value) {
                if (value == null || value.trim().isEmpty) {
                  return '$label is required.';
                }

                return null;
              }
            : null,
      ),
    );
  }
}
