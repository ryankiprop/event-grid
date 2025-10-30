from flask import request


def get_pagination_params():
    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1
    try:
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        per_page = 10
    per_page = max(1, min(per_page, 100))
    page = max(1, page)
    return page, per_page
