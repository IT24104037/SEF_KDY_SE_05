import 'package:flutter/material.dart';

import '../network/mobile_api.dart';
import '../theme/app_colors.dart';
import 'mobile_forms.dart';
import 'role_scaffold.dart';

typedef MobileAction = Future<void> Function(Future<void> Function());

class ManagedRecordsScreen extends StatefulWidget {
  const ManagedRecordsScreen({
    super.key,
    required this.title,
    required this.path,
    required this.currentRoute,
    required this.menuItems,
    required this.card,
    this.itemsKey = 'items',
    this.archivedPath,
    this.showCity = false,
    this.statuses = const {},
    this.sorts = const {'name': 'Name'},
    this.statusKey = 'status',
    this.descendingBoolean = false,
    this.query = const {},
    this.toolbar,
    this.showSearch = true,
    this.showSort = true,
    this.extraFilters = const {},
    this.initialDirection = 'asc',
  });

  final String title;
  final String path;
  final String currentRoute;
  final String itemsKey;
  final String statusKey;
  final String? archivedPath;
  final bool showCity;
  final bool descendingBoolean;
  final bool showSearch;
  final bool showSort;
  final String initialDirection;

  final Map<String, Map<String, String>> extraFilters;
  final Map<String, String> statuses;
  final Map<String, String> sorts;
  final Map<String, String> query;
  final List<RoleMenuItem> menuItems;

  final Widget Function(BuildContext, Json, bool, bool, MobileAction) card;

  final List<Widget> Function(BuildContext, bool, MobileAction)? toolbar;

  @override
  State<ManagedRecordsScreen> createState() => _ManagedRecordsScreenState();
}

class _ManagedRecordsScreenState extends State<ManagedRecordsScreen> {
  final _search = TextEditingController();
  final _city = TextEditingController();

  List<Json> _items = [];

  bool _loading = true;
  bool _busy = false;
  bool _archived = false;

  String? _error;
  String _status = '';
  String _direction = 'asc';
  late String _sort;

  final Map<String, String> _filters = {};

  int _page = 1;
  int _pages = 1;
  int _generation = 0;
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _sort = widget.sorts.keys.first;
    _direction = widget.initialDirection;
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final generation = ++_generation;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await MobileApi.request(
        _archived ? widget.archivedPath! : widget.path,
        query: {
          'page': '$_page',
          'pageSize': '20',
          'sortBy': _sort,
          if (widget.descendingBoolean)
            'descending': '${_direction == 'desc'}'
          else
            'sortDirection': _direction,
          if (_search.text.trim().isNotEmpty) 'search': _search.text.trim(),
          if (_city.text.trim().isNotEmpty) 'city': _city.text.trim(),
          if (_status.isNotEmpty) widget.statusKey: _status,
          for (final entry in _filters.entries)
            if (entry.value.isNotEmpty) entry.key: entry.value,
          ...widget.query,
        },
      );

      List<Json> items;
      int total;

      if (data is List) {
        items = MobileApi.list(data);
        final search = _search.text.trim().toLowerCase();

        if (search.isNotEmpty) {
          items = items.where((v) {
            return v.values.whereType<String>().any(
              (s) => s.toLowerCase().contains(search),
            );
          }).toList();
        }

        if (_city.text.trim().isNotEmpty) {
          items = items.where((v) {
            return '${v['city'] ?? ''}'.toLowerCase().contains(
              _city.text.trim().toLowerCase(),
            );
          }).toList();
        }

        total = items.length;
        items = items.skip((_page - 1) * 20).take(20).toList();
      } else {
        final map = MobileApi.map(data);
        items = MobileApi.list(map[widget.itemsKey]);
        total =
            int.tryParse(
              '${map['totalCount'] ?? map['total'] ?? items.length}',
            ) ??
            items.length;
      }

      final pages = ((total + 19) ~/ 20).clamp(1, 2147483647).toInt();

      if (!mounted || generation != _generation) return;

      if (_page > pages) {
        _page = pages;
        await _load();
        return;
      }

      setState(() {
        _items = items;
        _pages = pages;
        _total = total;
      });
    } catch (e) {
      if (mounted && generation == _generation) {
        setState(() => _error = mobileError(e));
      }
    } finally {
      if (mounted && generation == _generation) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _run(Future<void> Function() action) async {
    if (_busy || _loading) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await action();
      if (mounted) await _load();
    } catch (e) {
      if (mounted) setState(() => _error = mobileError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _select(
    String label,
    String value,
    Map<String, String> choices,
    void Function(String) change,
  ) => DropdownButtonFormField<String>(
    initialValue: value,
    key: ValueKey('$label:$value'),
    decoration: InputDecoration(labelText: label),
    items: choices.entries
        .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
        .toList(),
    onChanged: _busy || _loading
        ? null
        : (v) {
            if (v != null) change(v);
          },
  );

  @override
  Widget build(BuildContext context) {
    final disabled = _busy || _loading;

    return RoleScaffold(
      title: widget.title,
      roleLabel: 'Owner',
      expectedRole: 'PropertyOwner',
      accentColor: AppColors.ownerAccent,
      menuItems: widget.menuItems,
      currentRoute: widget.currentRoute,
      showBackButton: true,
      child: RefreshIndicator(
        onRefresh: () async {
          if (!_busy) await _load();
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              widget.title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
            ),
            Text('Total records: $_total'),

            if (widget.toolbar != null)
              Wrap(
                spacing: 8,
                children: widget.toolbar!(context, disabled, _run),
              ),

            if (widget.archivedPath != null)
              SwitchListTile(
                title: const Text('Show archived records'),
                value: _archived,
                onChanged: disabled
                    ? null
                    : (v) {
                        setState(() {
                          _archived = v;
                          _page = 1;
                          _status = '';
                        });
                        _load();
                      },
              ),

            if (widget.showSearch)
              TextField(
                controller: _search,
                enabled: !disabled,
                decoration: const InputDecoration(labelText: 'Search'),
                onSubmitted: (_) {
                  _page = 1;
                  _load();
                },
              ),

            if (widget.showCity)
              TextField(
                controller: _city,
                enabled: !disabled,
                decoration: const InputDecoration(labelText: 'City'),
              ),

            if (!_archived && widget.statuses.isNotEmpty)
              _select('Status', _status, {'': 'All', ...widget.statuses}, (v) {
                setState(() {
                  _status = v;
                  _page = 1;
                });
                _load();
              }),

            if (!_archived)
              for (final filter in widget.extraFilters.entries)
                _select(
                  filter.key == 'requestType'
                      ? 'Request type'
                      : filter.key == 'priority'
                      ? 'Priority'
                      : filter.key,
                  _filters[filter.key] ?? '',
                  {'': 'All', ...filter.value},
                  (v) {
                    setState(() {
                      _filters[filter.key] = v;
                      _page = 1;
                    });
                    _load();
                  },
                ),

            if (!_archived && widget.showSort) ...[
              _select('Sort by', _sort, widget.sorts, (v) {
                setState(() {
                  _sort = v;
                  _page = 1;
                });
                _load();
              }),
              _select(
                'Order',
                _direction,
                {'asc': 'Ascending', 'desc': 'Descending'},
                (v) {
                  setState(() {
                    _direction = v;
                    _page = 1;
                  });
                  _load();
                },
              ),
            ],

            Wrap(
              spacing: 8,
              children: [
                FilledButton(
                  onPressed: disabled
                      ? null
                      : () {
                          _page = 1;
                          _load();
                        },
                  child: const Text('Apply'),
                ),
                TextButton(
                  onPressed: disabled
                      ? null
                      : () {
                          setState(() {
                            _search.clear();
                            _city.clear();
                            _status = '';
                            _page = 1;
                            _sort = widget.sorts.keys.first;
                            _direction = widget.initialDirection;
                            _filters.clear();
                          });
                          _load();
                        },
                  child: const Text('Reset'),
                ),
              ],
            ),

            if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error)),

            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_items.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text('No records found.'),
              )
            else
              ..._items.map(
                (item) => widget.card(context, item, _archived, _busy, _run),
              ),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: disabled || _page <= 1
                      ? null
                      : () {
                          _page--;
                          _load();
                        },
                  child: const Text('Previous'),
                ),
                Text('Page $_page of $_pages'),
                TextButton(
                  onPressed: disabled || _page >= _pages
                      ? null
                      : () {
                          _page++;
                          _load();
                        },
                  child: const Text('Next'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
