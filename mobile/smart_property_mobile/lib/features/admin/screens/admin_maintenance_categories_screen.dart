import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/admin_service.dart';
import 'admin_home_screen.dart';

class AdminMaintenanceCategoriesScreen extends StatefulWidget {
  const AdminMaintenanceCategoriesScreen({super.key});

  @override
  State<AdminMaintenanceCategoriesScreen> createState() =>
      _AdminMaintenanceCategoriesScreenState();
}

class _AdminMaintenanceCategoriesScreenState
    extends State<AdminMaintenanceCategoriesScreen> {
  final _service = AdminService.instance;
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> _categories = [];

  String _statusFilter = 'All';
  String? _error;

  bool _loading = false;
  bool _editing = false;

  bool get _busy => _loading || _editing;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _errorText(Object error) {
    return error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
  }

  List<Map<String, dynamic>> get _filteredCategories {
    final search = _searchController.text.trim().toLowerCase();

    return _categories.where((category) {
      final active = category['isActive'] == true;

      if (_statusFilter == 'Active' && !active) {
        return false;
      }

      if (_statusFilter == 'Inactive' && active) {
        return false;
      }

      if (search.isEmpty) return true;

      final name = category['name']?.toString().toLowerCase() ?? '';

      final description =
          category['description']?.toString().toLowerCase() ?? '';

      return name.contains(search) || description.contains(search);
    }).toList();
  }

  Future<void> _load() async {
    if (_busy) return;

    setState(() {
      _loading = true;
      _error = null;
      _categories = [];
    });

    try {
      final categories = await _service.getMaintenanceCategories();

      if (!mounted) return;

      setState(() => _categories = categories);
    } catch (error) {
      if (!mounted) return;

      setState(() => _error = _errorText(error));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _edit({Map<String, dynamic>? category}) async {
    if (_busy) return;

    setState(() => _editing = true);

    bool? changed;

    try {
      changed = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (_) => _CategoryEditorDialog(category: category),
      );
    } finally {
      if (mounted) {
        setState(() => _editing = false);
      }
    }

    if (!mounted || changed != true) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          category == null ? 'Category created.' : 'Category updated.',
        ),
      ),
    );

    await _load();
  }

  Widget _categoryCard(Map<String, dynamic> category) {
    final active = category['isActive'] == true;

    final name = category['name']?.toString() ?? 'Category';

    final description = category['description']?.toString().trim() ?? '';

    final id = int.tryParse('${category['id']}');

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name,
            style: const TextStyle(
              color: AppColors.heading,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Chip(
            label: Text(active ? 'Active' : 'Inactive'),
            visualDensity: VisualDensity.compact,
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 8),
            SelectableText(description),
          ],
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _busy || id == null || id <= 0
                ? null
                : () => _edit(category: category),
            icon: const Icon(Icons.edit_outlined),
            label: const Text('Edit Category'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categories = _filteredCategories;

    return RoleScaffold(
      title: 'Maintenance Categories',
      roleLabel: 'Admin',
      expectedRole: 'Admin',
      accentColor: AppColors.adminAccent,
      menuItems: AdminHomeScreen.menuItems,
      currentRoute: AppRoutes.adminCategories,
      showBackButton: true,
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            ElevatedButton.icon(
              onPressed: _busy ? null : () => _edit(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.adminAccent,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.add),
              label: const Text('Add Category'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              enabled: !_busy,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Search categories',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            InputDecorator(
              decoration: const InputDecoration(
                labelText: 'Status',
                border: OutlineInputBorder(),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _statusFilter,
                  isExpanded: true,
                  isDense: true,
                  items: const [
                    DropdownMenuItem(value: 'All', child: Text('All')),
                    DropdownMenuItem(value: 'Active', child: Text('Active')),
                    DropdownMenuItem(
                      value: 'Inactive',
                      child: Text('Inactive'),
                    ),
                  ],
                  onChanged: _busy
                      ? null
                      : (value) {
                          if (value == null) return;

                          setState(() {
                            _statusFilter = value;
                          });
                        },
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_error!, style: const TextStyle(color: AppColors.error)),
                  TextButton(
                    onPressed: _busy ? null : _load,
                    child: const Text('Retry'),
                  ),
                ],
              )
            else ...[
              Text(
                '${categories.length} matching categories',
                style: const TextStyle(color: AppColors.secondaryText),
              ),
              const SizedBox(height: 12),
              if (categories.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: Text('No matching categories found.')),
                ),
              for (final category in categories) _categoryCard(category),
            ],
          ],
        ),
      ),
    );
  }
}

class _CategoryEditorDialog extends StatefulWidget {
  const _CategoryEditorDialog({this.category});

  final Map<String, dynamic>? category;

  @override
  State<_CategoryEditorDialog> createState() => _CategoryEditorDialogState();
}

class _CategoryEditorDialogState extends State<_CategoryEditorDialog> {
  final _formKey = GlobalKey<FormState>();
  final _service = AdminService.instance;

  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;

  late bool _isActive;

  bool _saving = false;
  String? _error;

  bool get _isNew => widget.category == null;

  @override
  void initState() {
    super.initState();

    _nameController = TextEditingController(
      text: widget.category?['name']?.toString() ?? '',
    );

    _descriptionController = TextEditingController(
      text: widget.category?['description']?.toString() ?? '',
    );

    _isActive = widget.category?['isActive'] == true || _isNew;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving || !(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      if (_isNew) {
        await _service.createMaintenanceCategory(
          name: _nameController.text,
          description: _descriptionController.text,
        );
      } else {
        final id = int.tryParse('${widget.category?['id']}');

        if (id == null || id <= 0) {
          throw Exception('The category ID is invalid.');
        }

        await _service.updateMaintenanceCategory(
          id,
          name: _nameController.text,
          description: _descriptionController.text,
          isActive: _isActive,
        );
      }

      if (!mounted) return;

      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
      });
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !_saving,
      child: AlertDialog(
        title: Text(_isNew ? 'Add Category' : 'Edit Category'),
        content: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: _nameController,
                  enabled: !_saving,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Category name',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    final name = value?.trim() ?? '';

                    if (name.isEmpty) {
                      return 'Enter a category name.';
                    }

                    if (name.length > 100) {
                      return 'Use 100 characters or fewer.';
                    }

                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  enabled: !_saving,
                  minLines: 2,
                  maxLines: 5,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if ((value?.trim().length ?? 0) > 500) {
                      return 'Use 500 characters or fewer.';
                    }

                    return null;
                  },
                ),
                if (!_isNew)
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Active'),
                    value: _isActive,
                    onChanged: _saving
                        ? null
                        : (value) {
                            setState(() => _isActive = value);
                          },
                  )
                else
                  const Text(
                    'New categories are created as active.',
                    style: TextStyle(color: AppColors.secondaryText),
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppColors.error)),
                ],
                if (_saving) ...[
                  const SizedBox(height: 12),
                  const LinearProgressIndicator(),
                ],
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: _saving ? null : () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving…' : 'Save'),
          ),
        ],
      ),
    );
  }
}
