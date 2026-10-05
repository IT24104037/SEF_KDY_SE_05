import 'package:flutter/material.dart';

import '../../app/app_router.dart';
import '../../features/auth/services/auth_service.dart';
import '../storage/secure_storage_service.dart';
import '../theme/app_colors.dart';

class RoleMenuItem {
  const RoleMenuItem({
    required this.label,
    required this.icon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final String route;
}

class RoleScaffold extends StatefulWidget {
  const RoleScaffold({
    super.key,
    required this.title,
    required this.roleLabel,
    required this.expectedRole,
    required this.accentColor,
    required this.menuItems,
    required this.currentRoute,
    required this.child,
    this.showBackButton = false,
  });

  final String title;
  final String roleLabel;
  final String expectedRole;
  final Color accentColor;
  final List<RoleMenuItem> menuItems;
  final String currentRoute;
  final Widget child;
  final bool showBackButton;

  @override
  State<RoleScaffold> createState() => _RoleScaffoldState();
}

class _RoleScaffoldState extends State<RoleScaffold> {
  final AuthService _authService = AuthService();

  StoredSession? _session;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final session = await _authService.restoreSession();

    if (!mounted) return;

    if (session == null || session.role != widget.expectedRole) {
      Navigator.of(context)
          .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
      return;
    }

    setState(() {
      _session = session;
      _loading = false;
    });
  }

  Future<void> _logout() async {
    await _authService.logout();

    if (!mounted) return;

    Navigator.of(context)
        .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
  }

  void _navigate(String route) {
    final navigator = Navigator.of(context);

    // Close the drawer first.
    navigator.pop();

    if (route == widget.currentRoute) {
      return;
    }

    // IMPORTANT:
    // pushNamed keeps the previous screen in the stack,
    // so the user can go back.
    navigator.pushNamed(route);
  }

  void _goBack() {
    final navigator = Navigator.of(context);

    if (navigator.canPop()) {
      navigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: widget.accentColor),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,

      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppColors.surface,
        surfaceTintColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 1,

        leadingWidth: widget.showBackButton ? 96 : 56,

        leading: Builder(
          builder: (scaffoldContext) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.showBackButton)
                  IconButton(
                    tooltip: 'Back',
                    onPressed: _goBack,
                    icon: const Icon(Icons.arrow_back),
                  ),

                IconButton(
                  tooltip: 'Menu',
                  onPressed: () {
                    Scaffold.of(scaffoldContext).openDrawer();
                  },
                  icon: const Icon(Icons.menu),
                ),
              ],
            );
          },
        ),

        titleSpacing: 4,

        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.heading,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              _session?.fullName ?? '',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.secondaryText,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),

        iconTheme: const IconThemeData(color: AppColors.heading),

        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.border),
        ),
      ),

      drawer: Drawer(
        backgroundColor: AppColors.darkNavigation,

        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
                child: Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: widget.accentColor,
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: const Text(
                        'SP',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Smart Property',
                            style: TextStyle(
                              color: Color(0xFFF8FAFC),
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),

                          const SizedBox(height: 3),

                          Text(
                            widget.roleLabel.toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFFAEB8BF),
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(color: Color(0xFF394751), height: 1),

              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(12),

                  itemCount: widget.menuItems.length,

                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 4),

                  itemBuilder: (context, index) {
                    final item = widget.menuItems[index];

                    final selected = item.route == widget.currentRoute;

                    return Material(
                      color: selected ? widget.accentColor : Colors.transparent,

                      borderRadius: BorderRadius.circular(8),

                      child: ListTile(
                        dense: true,

                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),

                        leading: Icon(
                          item.icon,
                          size: 20,
                          color: selected
                              ? Colors.white
                              : const Color(0xFFC5CDD3),
                        ),

                        title: Text(
                          item.label,
                          style: TextStyle(
                            color: selected
                                ? Colors.white
                                : const Color(0xFFC5CDD3),
                            fontSize: 13,
                            fontWeight: selected
                                ? FontWeight.w700
                                : FontWeight.w500,
                          ),
                        ),

                        onTap: () => _navigate(item.route),
                      ),
                    );
                  },
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _logout,
                    icon: const Icon(Icons.logout, size: 19),
                    label: const Text('Logout'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD9E0E4),
                      side: const BorderSide(color: Color(0xFF52616B)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),

      body: SafeArea(child: widget.child),
    );
  }
}
